"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function PremiumUpgradePrompt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-4 text-center"
    >
      <div className="flex justify-center">
        <div className="rounded-full bg-primary/10 p-2">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold">
          Deep Emotion Analysis limit reached
        </p>
        <p className="text-xs text-muted-foreground">
          You&apos;ve used all 3 free emotion analyses this session. Upgrade to
          Premium for unlimited vocal insights.
        </p>
      </div>

      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Upgrade to Premium
      </Link>
    </motion.div>
  );
}
