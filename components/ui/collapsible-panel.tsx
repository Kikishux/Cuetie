"use client"

import React from "react"
import { Collapsible } from "@base-ui/react/collapsible"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CollapsiblePanelProps {
  title: string
  summary?: string
  defaultOpen?: boolean
  completionBadge?: boolean
  children: React.ReactNode
}

export function CollapsiblePanel({
  title,
  summary,
  defaultOpen = false,
  completionBadge = false,
  children,
}: CollapsiblePanelProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-border bg-card"
    >
      <Collapsible.Trigger className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-muted/50 transition-colors">
        <span className="text-sm font-semibold shrink-0">{title}</span>

        {!open && summary && (
          <span className="flex-1 text-sm text-muted-foreground truncate min-w-0">
            {summary}
          </span>
        )}

        {!summary && <span className="flex-1" />}

        <span className="flex items-center gap-2 shrink-0 ml-auto">
          {completionBadge && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 text-xs font-semibold">
              ✓
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </span>
      </Collapsible.Trigger>

      <Collapsible.Panel className="grid grid-rows-[0fr] data-[open]:grid-rows-[1fr] transition-[grid-template-rows] duration-200">
        <div className="overflow-hidden min-h-0">
          <div className="pb-4 px-4">{children}</div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
