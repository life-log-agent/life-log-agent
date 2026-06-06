/* life_log — typed category map + synthetic sample data.
   All imagery/text here is clearly synthetic (no real PII / no real prices). */

export type Tone =
  | "gray"
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple";

export type CategoryKey = "cosmetic" | "travel" | "food" | "etc";

export interface Category {
  emoji: string;
  label: string;
  tone: Tone;
  bg: string;
}

export const CAT: Record<CategoryKey, Category> = {
  cosmetic: { emoji: "💄", label: "화장품", tone: "pink" as Tone, bg: "#FFE3F1" },
  travel: { emoji: "✈️", label: "여행지", tone: "blue", bg: "#DDF0FF" },
  food: { emoji: "🍽️", label: "맛집", tone: "yellow", bg: "#FFF0CC" },
  etc: { emoji: "📌", label: "기타", tone: "purple", bg: "#EEE3FF" },
};
