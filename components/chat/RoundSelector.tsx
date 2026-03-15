"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Zap, Target, Sparkles, Clock } from "lucide-react";
import type { RoundType } from "@/lib/types/database";

interface RoundOption {
  value: RoundType;
  label: string;
  desc: string;
  duration: string;
  icon: typeof Zap;
  premium: boolean;
}

const roundOptions: RoundOption[] = [
  {
    value: "quick",
    label: "Quick Round",
    desc: "Practice one key moment",
    duration: "~5 min",
    icon: Zap,
    premium: false,
  },
  {
    value: "standard",
    label: "Standard Round",
    desc: "A full conversation arc",
    duration: "~15 min",
    icon: Target,
    premium: false,
  },
  {
    value: "deep",
    label: "Deep Practice",
    desc: "Explore in depth",
    duration: "~20 min",
    icon: Sparkles,
    premium: true,
  },
];

interface RoundSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (roundType: RoundType) => void;
  isPremium: boolean;
  isLoading: boolean;
}

export default function RoundSelector({
  open,
  onClose,
  onSelect,
  isPremium,
  isLoading,
}: RoundSelectorProps) {
  const [selected, setSelected] = useState<RoundType>("standard");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose your practice round</DialogTitle>
          <DialogDescription>
            Each round simulates a realistic conversation length.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {roundOptions.map((opt) => {
            const Icon = opt.icon;
            const locked = opt.premium && !isPremium;
            const isSelected = selected === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                disabled={locked}
                onClick={() => setSelected(opt.value)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : locked
                      ? "border-border opacity-50 cursor-not-allowed"
                      : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{opt.label}</span>
                    {opt.premium && (
                      <Badge variant="secondary" className="text-[10px]">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {opt.duration}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        <Button
          onClick={() => onSelect(selected)}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Starting..." : "Start Practice"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
