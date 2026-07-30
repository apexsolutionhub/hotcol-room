import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

/** Reception-style section intro used across guest pages. */
export function PageHero({
  eyebrow = "HotCol Room",
  title,
  description,
  icon,
  action,
  className,
}: PageHeroProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br from-card via-card to-primary/6 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10 sm:p-5 md:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-24 w-24 rounded-full bg-sky-500/10 blur-2xl" />
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-10">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground md:text-xs">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-sm text-pretty text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? (
          <div className="shrink-0 self-start sm:pt-0.5">{action}</div>
        ) : null}
      </div>
    </div>
  );
}
