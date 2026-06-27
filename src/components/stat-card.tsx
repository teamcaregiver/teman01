import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "sage" | "teal" | "peach" | "lavender";
}

const tones = {
  sage: "gradient-sage",
  teal: "gradient-teal",
  peach: "gradient-peach",
  lavender: "gradient-lavender",
};

export function StatCard({ label, value, hint, icon, tone = "teal" }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-soft",
      )}
    >
      <div className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-70", tones[tone])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && <div className="rounded-xl bg-background/60 p-2 text-foreground/70 backdrop-blur">{icon}</div>}
      </div>
    </motion.div>
  );
}
