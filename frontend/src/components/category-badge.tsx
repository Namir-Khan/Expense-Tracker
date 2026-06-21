import { getCategory } from "@/lib/api/mock";

export function CategoryBadge({ id }: { id: string }) {
  const cat = getCategory(id);
  const Icon = cat.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
      style={{
        backgroundColor: `color-mix(in oklab, var(${cat.colorVar}) 18%, transparent)`,
        color: `var(${cat.colorVar})`,
      }}
    >
      <Icon className="h-3 w-3" />
      {cat.name}
    </span>
  );
}