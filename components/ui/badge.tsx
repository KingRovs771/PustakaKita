import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        sd: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-200 dark:border-red-800 rounded-full",
        smp: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800 rounded-md",
        sma: "bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 rounded-sm",
        fiksi:
          "border-violet-600/30 text-violet-700 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-700",
        sains:
          "border-sky-600/30 text-sky-700 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700",
        sejarah:
          "border-amber-700/30 text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700",
        komik:
          "border-rose-600/30 text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

