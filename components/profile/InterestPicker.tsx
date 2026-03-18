"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface InterestPickerProps {
  value: string[]
  onChange: (interests: string[]) => void
}

const CATEGORIES: { name: string; slugs: string[] }[] = [
  { name: "Outdoors", slugs: ["hiking", "camping", "climbing", "running", "biking"] },
  { name: "Arts", slugs: ["museums", "photography", "design", "theater", "books", "writing", "crafts"] },
  { name: "Food", slugs: ["cooking", "coffee", "wine", "restaurants", "baking"] },
  { name: "Entertainment", slugs: ["movies", "live_music", "gaming", "podcasts", "tv_shows", "concerts"] },
  { name: "Wellness", slugs: ["yoga", "meditation", "fitness", "mental_wellness", "cycling", "nutrition"] },
  { name: "Social", slugs: ["traveling", "brunch", "community_events", "volunteering", "board_games", "trivia", "meetups"] },
  { name: "Learning", slugs: ["languages", "tech", "history", "psychology", "science"] },
]

const LABEL_OVERRIDES: Record<string, string> = {
  tv_shows: "TV Shows",
  live_music: "Live Music",
  community_events: "Community Events",
  mental_wellness: "Mental Wellness",
}

function toLabel(slug: string): string {
  if (LABEL_OVERRIDES[slug]) return LABEL_OVERRIDES[slug]
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export default function InterestPicker({ value, onChange }: InterestPickerProps) {
  const [search, setSearch] = useState("")
  const [customInput, setCustomInput] = useState("")

  const atMax = value.length >= 10

  function toggle(slug: string) {
    if (value.includes(slug)) {
      onChange(value.filter((s) => s !== slug))
    } else if (!atMax) {
      onChange([...value, slug])
    }
  }

  function remove(slug: string) {
    onChange(value.filter((s) => s !== slug))
  }

  function addCustom() {
    const trimmed = customInput.trim()
    if (!trimmed || atMax || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setCustomInput("")
  }

  const filteredCategories = CATEGORIES.map((cat) => {
    if (!search) return cat
    const q = search.toLowerCase()
    const filtered = cat.slugs.filter(
      (slug) => slug.includes(q) || toLabel(slug).toLowerCase().includes(q)
    )
    return { ...cat, slugs: filtered }
  }).filter((cat) => cat.slugs.length > 0)

  return (
    <div>
      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {value.map((slug) => (
            <Badge key={slug} variant="default" className="flex items-center gap-1 pr-1">
              {toLabel(slug)}
              <button
                type="button"
                onClick={() => remove(slug)}
                className="ml-0.5 rounded-full hover:bg-white/20 p-0.5"
                aria-label={`Remove ${toLabel(slug)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Max warning */}
      {atMax && (
        <p className="text-xs text-destructive mb-3">Maximum 10 interests selected</p>
      )}

      {/* Search */}
      <Input
        placeholder="Search interests…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      {/* Empty state */}
      {filteredCategories.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No interests match your search
        </p>
      )}

      {/* Category sections */}
      {filteredCategories.map((cat) => (
        <div key={cat.name} className="space-y-2 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {cat.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {cat.slugs.map((slug) => {
              const selected = value.includes(slug)
              const disabled = atMax && !selected
              return (
                <Badge
                  key={slug}
                  variant={selected ? "default" : "outline"}
                  className={cn(
                    "transition-colors select-none",
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  )}
                  onClick={() => !disabled && toggle(slug)}
                >
                  {selected && <Check className="mr-1 h-3 w-3" />}
                  {toLabel(slug)}
                </Badge>
              )
            })}
          </div>
        </div>
      ))}

      {/* Custom interest */}
      <div className="flex gap-2 mt-2">
        <Input
          placeholder="Add your own interest…"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addCustom()
            }
          }}
          disabled={atMax}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addCustom}
          disabled={atMax || !customInput.trim()}
        >
          Add
        </Button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground mt-3">
        Select up to 10 interests — these help find scenarios and matches that fit your world.
      </p>
    </div>
  )
}
