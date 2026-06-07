# SERVER_RUNBOOK.md

`life_log`를 **단일 리눅스 서버(공인 IP 1개)** 에 셀프 호스팅하기 위한 실행 대본.
Supabase(Postgres·pgvector·Auth·Storage)와 Clova(HCX-005·Embedding)는 **이미 매니지드 클라우드**이므로 이 서버는 **백엔드(FastAPI) + 프론트(정적 빌드)** 만 호스팅한다.

> 비밀값은 **변수명만** 적는다. 실제 값은 서버의 시크릿(환경변수/EnvironmentFile)에만 둔다.
> 서버 명령은 **실행 직전에 무엇을·왜 하는지 설명하고 승인**받는다. 한 번의 승인이 다음 단계로 연장되지 않는다.

---

## 0. 구성 개요

```
[브라우저] ──HTTPS──> [Nginx] ──┬── /        → 프론트 정적 빌드(dist) + SPA fallback
 (<SERVER_IP>.nip.io)           └── /api/    → 127.0.0.1:8000 (uvicorn, /api 접두어 제거)
                                                   │
                                                   └──> Supabase · Clova (매니지드 클라우드)
```

| 항목 | 값 |
|------|-----|
| 외부 포트 | 443(HTTPS), 80(certbot/리다이렉트), 22(SSH) |
| 백엔드 내부 포트 | 127.0.0.1:8000 (외부 비공개) |
| 호스트네임 | `<SERVER_IP>.nip.io` (무료 IP 기반 DNS, 등록 불필요) |
| 프로세스 관리 | systemd (`life_log-api.service`) |
| 코드 위치(예) | `/opt/life_log` |
| 백엔드 시크릿 | `/etc/life_log/backend.env` (root:root, 0600) |

---

## 1. ⚠️ 배포 전 차단 항목 (Pre-flight Blockers)

인터넷 노출 **전에 반드시** 해결한다. 미해결 시 배포 금지.

- [x] **JWT 서명 검증** — Supabase는 **ES256(P-256) 비대칭 키**를 쓴다(JWKS `alg=ES256/EC/P-256` 확인). `app/auth.py`는 `PyJWKClient`로 JWKS 공개키를 받아 ES256·만료(exp)·audience(`authenticated`)를 검증한다(과거 `verify_signature=False` 결함 해결). `cryptography` 의존성 필요. ※ 공유 HS256 시크릿이 아니므로 그 방식으로 검증하면 모든 로그인이 401이 된다.
- [x] **토큰 로깅 제거** — 토큰/claim을 로깅하지 않고 예외 타입명만 남긴다(CLAUDE.md §8).
- [ ] **CORS 출처 제한** — `BACKEND_CORS_ORIGINS` 를 `https://<SERVER_IP>.nip.io` 로. 와일드카드 금지.
- [ ] **service_role 키 분리 확인** — 프론트 빌드에는 anon 키만. service_role 은 백엔드 env 에만.
- [ ] **Supabase RLS / Storage 정책** — 백엔드는 service_role(RLS 우회)이지만, 프론트가 **anon 키로 Storage에 직접 업로드**하므로 버킷 RLS가 없으면 타 사용자 객체에 직접 접근할 수 있다. ① Storage 버킷을 **비공개**로 두고 ② 경로 프리픽스(`{auth.uid()}/`) 기반 정책을 건다. 테이블 RLS도 defense-in-depth로 권장. **적용 SQL은 부록(RLS 정책) 참조.** (코드가 아니라 Supabase 설정이므로 배포와 별도 단계)
- [ ] **로컬 검증 통과** — `uv run pytest`, `uv run ruff check .`, `uv run mypy app`, `pnpm build` 그린.
- [ ] **비밀값 노출 스캔** — 커밋/이미지에 키·`.env` 미포함 확인.

---

## 2. 서버 준비 (1회)

설명: 런타임·웹서버·인증서 도구 설치, 방화벽 최소 개방.

```bash
# uv (Python 런타임 관리; requires-python>=3.12 → uv가 최신 3.x를 설치, 예: 3.14)
curl -LsSf https://astral.sh/uv/install.sh | sh
# Node 20 (프론트 빌드용)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
# Nginx + certbot
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
# 방화벽: NCloud는 콘솔 ACG가 실제 방화벽(22/80/443 인바운드 허용 필요). ufw는 선택.
```

> ⚠️ **IPv6 비활성 호스트(NCloud 등)에서 nginx 설치/기동 실패** — 기본 사이트의 `listen [::]:80` 때문에 `socket() [::]:80 failed (97)` 로 nginx-core 설정(configure)이 깨진다. 해결:
> ```bash
> sudo sed -i 's/listen \[::\]:80/# &/' /etc/nginx/sites-available/default
> sudo dpkg --configure -a && sudo systemctl restart nginx
> ```
> (본 런북 §8의 커스텀 사이트는 IPv4 `listen 80`만 써서 이 문제와 무관하다.)

---

## 3. 코드 반영

설명: 서버는 배포 산출물만 받는다. **서버에서 코드 직접 편집 금지**(CLAUDE.md §7).

```bash
sudo mkdir -p /opt/life_log && sudo chown $USER /opt/life_log
git clone <REPO_URL> /opt/life_log      # 접속정보는 문서에 적지 않음
cd /opt/life_log
git checkout <배포-브랜치/태그>
```

---

## 4. 시크릿 주입

설명: 백엔드 키를 git 밖 파일로 주입. 평문 `.env` 를 서버에 올리지 않고, 서버에서 직접 작성/권한 제한.

```bash
sudo mkdir -p /etc/life_log
sudo install -m 600 /dev/null /etc/life_log/backend.env
sudo nano /etc/life_log/backend.env      # 아래 변수 목록을 실제 값으로 채움
```

`/etc/life_log/backend.env` 채울 변수(값은 시크릿): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_STORAGE_BUCKET`, `DATABASE_URL`, `CLOVA_API_KEY`, `CLOVA_API_SECRET`, `CLOVA_API_URL`, `CLOVA_API_PATH_PREFIX`, `BACKEND_CORS_ORIGINS=https://<SERVER_IP>.nip.io`, `EMBEDDING_DIM`.

---

## 5. DB 마이그레이션 (배포와 분리된 명시 단계)

설명: 스키마/ pgvector 변경 적용. **백업·롤백 경로 확인 후** 실행. `alembic`은 `migrations/env.py`가 동기 드라이버를 쓰므로 **`psycopg2-binary` 의존성이 필요**(프로젝트 deps에 포함됨).

> ⚠️ **이미 적용돼 있을 수 있다.** 로컬 개발이 같은 Supabase 클라우드 DB를 써왔다면 스키마가 이미 존재한다. 무작정 `upgrade`하면 충돌하니 **현재 상태부터 확인**한다. (실배포 사례: `items`·`chunks`·`alembic_version` 존재 + `vector` 활성 + 버전=head → 마이그레이션 불필요.)

```bash
cd /opt/life_log
uv sync
set -a && . /etc/life_log/backend.env && set +a
# 1) 현재 상태 확인 — 이미 head면 아무것도 하지 않는다
uv run alembic current        # 출력이 head(예: 001)면 SKIP
# 2) (필요할 때만) pgvector 확인 후 적용
uv run alembic upgrade head
```

- **백업:** 마이그레이션 전 Supabase 대시보드 **Database → Backups** 확인(Free 플랜은 자동 백업 없음 — 실변경 시 수동 백업).
- **롤백:** 직전 리비전으로 `uv run alembic downgrade -1`. (파괴적 변경이면 백업 복원으로만 롤백)

---

## 6. 백엔드 상시화 (systemd)

설명: uvicorn 을 서비스로 등록해 부팅/크래시 시 자동 기동.

> 주의: 처리 파이프라인이 FastAPI **BackgroundTasks(in-process)** 라 재시작 시 진행 중 처리가 유실된다. 데모 단계는 **단일 워커** 권장. 확장 시 arq/Celery 도입(부록 A).

`/etc/systemd/system/life_log-api.service`:

```ini
[Unit]
Description=life_log FastAPI
After=network.target

[Service]
WorkingDirectory=/opt/life_log
EnvironmentFile=/etc/life_log/backend.env
ExecStart=/home/<user>/.local/bin/uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=on-failure
User=<service-user>

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now life_log-api
systemctl status life_log-api
curl -s http://127.0.0.1:8000/health      # {"status":"ok"} 기대
```

---

## 7. 프론트 빌드 & 배치

설명: Vite 는 빌드 시 env 를 번들에 박으므로 빌드 환경에서 주입. dist 를 Nginx 루트로.

```bash
cd /opt/life_log/frontend
# 빌드 env (anon 키만!): frontend/.env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_API_BASE_URL=/api
npm ci
npm run build                              # → frontend/dist (이 경로를 §8 nginx root로 직접 서빙)
```

---

## 8. Nginx + HTTPS

설명: 정적 서빙 + `/api` 프록시 + Let's Encrypt 인증서(`<SERVER_IP>.nip.io`).

`/etc/nginx/sites-available/life_log`:

```nginx
server {
    listen 80;
    server_name <SERVER_IP>.nip.io;

    root /opt/life_log/frontend/dist;
    index index.html;

    # API → 백엔드 ( /api 접두어 제거하여 전달 )
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback (PWA 라우팅)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/life_log /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
# Let's Encrypt (도메인 = nip.io 호스트네임) — HTTP→HTTPS 리다이렉트 자동 설정
sudo certbot --nginx -d <SERVER_IP>.nip.io
```

---

## 9. 검증 (완료 주장 전 증거 수집)

- [ ] `curl -s https://<SERVER_IP>.nip.io/api/health` → `{"status":"ok"}`
- [ ] 브라우저에서 로그인(Supabase Auth) 성공
- [ ] 업로드 → `pending→processing→ready` 진행, 실패 시 재시도 동작
- [ ] 분류/타임라인 표시, 항목 상세 원본 미리보기
- [ ] 자연어 검색 → 답변 + 근거 기록 표시
- [ ] PWA 설치 프롬프트 + 서비스워커 등록(HTTPS 보안 컨텍스트 확인)
- [ ] 가짜/서명 없는 JWT 거부되는지 확인(§1 차단 항목 회귀 테스트)

---

## 10. 운영 / 트러블슈팅

```bash
journalctl -u life_log-api -f            # 백엔드 로그
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl restart life_log-api      # 재배포 후
```

**재배포 절차:** `git pull` → (필요 시) `uv sync` → (스키마 변경 시) §5 마이그레이션 → `sudo systemctl restart life_log-api` → 프론트 변경 시 §7 재빌드·복사.

**롤백:** 직전 태그로 `git checkout` 후 재기동. DB 는 §5 롤백 절차.

---

## 부록. 실배포 기록 (2026-06-07)

대상: NCloud Ubuntu 22.04 서버, 공인 IP `<SERVER_IP>`, 계정 `root`, 호스트네임 `<SERVER_IP>.nip.io`.

- **접속**: 로컬에서 ed25519 키 생성 → 서버 `authorized_keys`에 공개키 등록 → `ssh -i ~/.ssh/life_log_deploy root@…`.
- **설치**: uv가 **Python 3.14** 설치(>=3.12 충족), Node 20, nginx 1.18, certbot 1.21.
- **nginx IPv6 이슈**: 기본 사이트 `listen [::]:80` 때문에 `socket() [::]:80 failed (97)` → 해당 라인 주석 처리 후 `dpkg --configure -a` + nginx 재기동으로 해결(§2 경고 참고).
- **코드**: GitHub `deploy/prod-server-prep` 브랜치 `git clone` → `/opt/life_log` (레포 공개라 익명 clone 가능).
- **시크릿**: 로컬 `.env`를 `scp`로 `/etc/life_log/backend.env`(0600) 전송, CRLF 제거, `BACKEND_CORS_ORIGINS`·`VITE_API_BASE_URL` 운영값으로 조정. 프론트는 `/opt/life_log/frontend/.env`.
- **DB**: 이미 `alembic 001(head)` + `items`·`chunks` + `vector` 활성 → **마이그레이션 생략**.
- **백엔드**: `/etc/systemd/system/life_log-api.service` — venv 바이너리 `/opt/life_log/.venv/bin/uvicorn` 직접 실행(uv 래퍼 미사용), 127.0.0.1:8000, 부팅 자동시작.
- **프론트/Nginx**: `/opt/life_log/frontend/dist` 직접 서빙, `/api/`→백엔드 프록시.
- **HTTPS**: `certbot --nginx -d <SERVER_IP>.nip.io --redirect` 로 Let's Encrypt 발급(만료 2026-09-05, 자동 갱신). HTTP-01 성공 = ACG가 80/443 허용.
- **검증**: 외부에서 `/api/health` 200, HTTP→HTTPS 301, 프론트 서빙, 무인증 `/api/items` 401 확인. **브라우저 로그인~검색 실사용 흐름은 미검증(별도 확인 필요)**.
- **로그인 전제**: Supabase **Authentication → URL Configuration** 의 Site URL/Redirect URLs 에 `https://<SERVER_IP>.nip.io` 추가 필요.

---

## 부록. RLS 정책 (적용 필요 — Supabase SQL 에디터에서 실행)

> 코드 배포와 **별개**. 백엔드 인가 검증(`/ingest`의 `storage_path` 프리픽스 체크)에 더한 defense-in-depth.
> 프론트가 anon 키로 Storage에 직접 업로드하므로, **Storage 정책이 없으면 백엔드 검증을 우회해 직접 접근**할 수 있다.

**1) Storage 버킷 — 본인 경로(`{uid}/...`)만 접근**
```sql
-- 버킷은 비공개(Public = off)로 둔다. 아래는 storage.objects RLS 정책.
create policy "own-folder-read" on storage.objects for select
  using ( bucket_id = 'life-log-images' and (storage.foldername(name))[1] = auth.uid()::text );
create policy "own-folder-insert" on storage.objects for insert
  with check ( bucket_id = 'life-log-images' and (storage.foldername(name))[1] = auth.uid()::text );
create policy "own-folder-delete" on storage.objects for delete
  using ( bucket_id = 'life-log-images' and (storage.foldername(name))[1] = auth.uid()::text );
```

**2) 테이블 RLS (defense-in-depth — 백엔드는 service_role이라 우회하지만, anon 키 직접 쿼리를 차단)**
```sql
alter table items enable row level security;
alter table chunks enable row level security;
create policy "items-own" on items for all
  using ( user_id = auth.uid()::text ) with check ( user_id = auth.uid()::text );
create policy "chunks-own" on chunks for all
  using ( exists (select 1 from items where items.id = chunks.item_id and items.user_id = auth.uid()::text) );
```

> 적용 후 검증: 다른 사용자 토큰으로 `{타인_uid}/...` 경로 업로드/조회가 거부되는지 확인.
