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

- [ ] **JWT 서명 검증 활성화** — `app/auth.py` 가 현재 `options={"verify_signature": False}` 로 **서명을 검증하지 않는다.** 누구나 `sub` 만 넣은 가짜 토큰으로 타인 데이터 접근 가능. `verify_signature: True` 로 바꾸고 `supabase_jwt_secret`(HS256)로 실제 검증되도록 수정 → 검증 테스트 추가.
- [ ] **토큰 로깅 제거** — `app/auth.py` 의 `logger.info("JWT header: %s", ...)` 제거(CLAUDE.md §8 비밀값/PII 로깅 금지).
- [ ] **CORS 출처 제한** — `BACKEND_CORS_ORIGINS` 를 `https://<SERVER_IP>.nip.io` 로. 와일드카드 금지.
- [ ] **service_role 키 분리 확인** — 프론트 빌드에는 anon 키만. service_role 은 백엔드 env 에만.
- [ ] **Supabase RLS** — 가능하면 테이블에 Row Level Security 활성화(클라이언트가 보낸 user_id 불신뢰; 부록 C).
- [ ] **로컬 검증 통과** — `uv run pytest`, `uv run ruff check .`, `uv run mypy app`, `pnpm build` 그린.
- [ ] **비밀값 노출 스캔** — 커밋/이미지에 키·`.env` 미포함 확인.

---

## 2. 서버 준비 (1회)

설명: 런타임·웹서버·인증서 도구 설치, 방화벽 최소 개방.

```bash
# uv (Python 3.12 런타임 관리)
curl -LsSf https://astral.sh/uv/install.sh | sh
# Node (프론트 빌드용) — nvm 또는 배포판 패키지
# Nginx + certbot
sudo apt update && sudo apt install -y nginx
sudo apt install -y certbot python3-certbot-nginx
# 방화벽: 22/80/443 만
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
```

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

설명: 스키마/ pgvector 변경 적용. **백업·롤백 경로 확인 후** 실행.

```bash
cd /opt/life_log
uv sync
# pgvector extension 활성화 확인 (Supabase 대시보드 Database > Extensions 에서 'vector' enable)
set -a && . /etc/life_log/backend.env && set +a
uv run alembic upgrade head
```

- **백업:** 마이그레이션 전 Supabase 대시보드에서 백업/스냅샷 확인.
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
# 빌드 env (anon 키만!) — 예: frontend/.env.production 작성
#   VITE_SUPABASE_URL=...  VITE_SUPABASE_ANON_KEY=...  VITE_API_BASE_URL=/api
npm ci
npm run build                              # → frontend/dist
sudo mkdir -p /var/www/life_log
sudo cp -r dist/* /var/www/life_log/
```

---

## 8. Nginx + HTTPS

설명: 정적 서빙 + `/api` 프록시 + Let's Encrypt 인증서(`<SERVER_IP>.nip.io`).

`/etc/nginx/sites-available/life_log`:

```nginx
server {
    listen 80;
    server_name <SERVER_IP>.nip.io;

    root /var/www/life_log;
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
