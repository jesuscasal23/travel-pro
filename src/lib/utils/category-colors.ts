export interface CategoryStyle {
  bgClass: string;
  textClass: string;
  strokeHsl: string;
  bgHsl: string;
  badgeBg: string;
}

const CATEGORY_MAP: Record<string, CategoryStyle> = {
  culture:   { bgClass: "bg-teal-500",   textClass: "text-teal-700 dark:text-teal-300",    strokeHsl: "hsl(181, 80%, 25%)", bgHsl: "hsl(181, 80%, 95%)", badgeBg: "bg-teal-600" },
  explore:   { bgClass: "bg-blue-500",    textClass: "text-blue-700 dark:text-blue-300",    strokeHsl: "hsl(210, 70%, 45%)", bgHsl: "hsl(210, 70%, 95%)", badgeBg: "bg-blue-600" },
  food:      { bgClass: "bg-amber-500",   textClass: "text-amber-700 dark:text-amber-300",  strokeHsl: "hsl(38, 92%, 50%)",  bgHsl: "hsl(38, 92%, 95%)",  badgeBg: "bg-amber-500" },
  art:       { bgClass: "bg-purple-500",  textClass: "text-purple-700 dark:text-purple-300", strokeHsl: "hsl(280, 60%, 55%)", bgHsl: "hsl(280, 60%, 95%)", badgeBg: "bg-purple-600" },
  nightlife: { bgClass: "bg-pink-500",    textClass: "text-pink-700 dark:text-pink-300",    strokeHsl: "hsl(330, 70%, 50%)", bgHsl: "hsl(330, 70%, 95%)", badgeBg: "bg-pink-600" },
  nature:    { bgClass: "bg-green-500",   textClass: "text-green-700 dark:text-green-300",  strokeHsl: "hsl(142, 70%, 35%)", bgHsl: "hsl(142, 70%, 95%)", badgeBg: "bg-green-600" },
  transport: { bgClass: "bg-slate-500",   textClass: "text-slate-700 dark:text-slate-300",  strokeHsl: "hsl(220, 10%, 50%)", bgHsl: "hsl(220, 10%, 95%)", badgeBg: "bg-slate-500" },
  adventure: { bgClass: "bg-orange-500",  textClass: "text-orange-700 dark:text-orange-300", strokeHsl: "hsl(20, 85%, 55%)",  bgHsl: "hsl(20, 85%, 95%)",  badgeBg: "bg-orange-600" },
  wellness:  { bgClass: "bg-cyan-500",    textClass: "text-cyan-700 dark:text-cyan-300",    strokeHsl: "hsl(175, 55%, 45%)", bgHsl: "hsl(175, 55%, 95%)", badgeBg: "bg-cyan-600" },
};

const DEFAULT_STYLE: CategoryStyle = {
  bgClass: "bg-gray-500",
  textClass: "text-gray-700 dark:text-gray-300",
  strokeHsl: "hsl(0, 0%, 60%)",
  bgHsl: "hsl(0, 0%, 95%)",
  badgeBg: "bg-gray-500",
};

export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_MAP[category.toLowerCase()] ?? DEFAULT_STYLE;
}
