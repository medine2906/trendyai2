import { cn } from "@/lib/utils";

export function Avatar({
  src,
  alt,
  fallback,
  className,
  ringGradient = false,
  size = 40,
}: {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
  ringGradient?: boolean;
  size?: number;
}) {
  const inner = (
    <span
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center text-sm font-medium text-muted-foreground",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        fallback.slice(0, 1).toUpperCase()
      )}
    </span>
  );

  if (!ringGradient) return inner;

  return (
    <span
      className="inline-flex items-center justify-center rounded-full p-[2px]"
      style={{
        background:
          "linear-gradient(135deg, var(--story-gradient-from), var(--story-gradient-via), var(--story-gradient-to))",
      }}
    >
      <span className="rounded-full bg-background p-[2px]">{inner}</span>
    </span>
  );
}
