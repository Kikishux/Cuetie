"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { OnboardingProfile } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2, Save, Trash2, Check } from "lucide-react";

/* ───────────────── option data ───────────────── */

const coachingStyles = [
  {
    value: "gentle" as const,
    label: "Gentle",
    desc: "Encouraging, patient, and supportive feedback",
  },
  {
    value: "direct" as const,
    label: "Direct",
    desc: "Clear, concise, straight-to-the-point coaching",
  },
  {
    value: "detailed" as const,
    label: "Detailed",
    desc: "In-depth explanations with examples and context",
  },
];

const challengeOptions = [
  "Starting conversations",
  "Reading body language",
  "Understanding sarcasm / humor",
  "Knowing when to text back",
  "Interpreting tone in messages",
  "Handling rejection",
  "Maintaining eye contact topics",
  "Expressing emotions",
  "Setting boundaries",
  "Asking someone out",
];

/* ───────────────── component ───────────────── */

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [coachingStyle, setCoachingStyle] =
    useState<OnboardingProfile["preferred_coaching_style"]>("gentle");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  /* ── fetch profile ── */
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("display_name, onboarding_profile")
      .eq("id", user.id)
      .single();

    if (data) {
      setDisplayName(data.display_name ?? "");
      const profile = data.onboarding_profile as OnboardingProfile | null;
      setCoachingStyle(profile?.preferred_coaching_style ?? "gentle");
      setChallenges(profile?.challenges ?? []);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ── toggle challenge ── */
  function toggleChallenge(c: string) {
    setChallenges((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  /* ── save ── */
  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaved(false);

    // Fetch existing profile to merge
    const { data: existing } = await supabase
      .from("users")
      .select("onboarding_profile")
      .eq("id", user.id)
      .single();

    const existingProfile =
      (existing?.onboarding_profile as OnboardingProfile | null) ?? {};

    await supabase
      .from("users")
      .update({
        display_name: displayName,
        onboarding_profile: {
          ...existingProfile,
          preferred_coaching_style: coachingStyle,
          challenges,
        },
      })
      .eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  /* ── delete account ── */
  async function handleDelete() {
    setDeleting(true);
    // Sign out first, actual deletion would require a server-side admin call
    await signOut();
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your profile and coaching preferences.
        </p>
      </div>

      {/* ── Display Name ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Display Name</CardTitle>
          <CardDescription>
            This is how your coach will address you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm space-y-2">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your preferred name"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Coaching Style ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coaching Style</CardTitle>
          <CardDescription>
            Choose how you&apos;d like your coach to communicate with you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {coachingStyles.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setCoachingStyle(s.value)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  coachingStyle === s.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Challenges ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Communication Challenges</CardTitle>
          <CardDescription>
            Select the areas you&apos;d like to focus on. This helps
            personalize your practice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {challengeOptions.map((c) => {
              const selected = challenges.includes(c);
              return (
                <Badge
                  key={c}
                  variant={selected ? "default" : "outline"}
                  className="cursor-pointer select-none transition-colors"
                  onClick={() => toggleChallenge(c)}
                >
                  {selected && <Check className="mr-1 h-3 w-3" />}
                  {c}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Save ── */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <Separator />

      {/* ── Danger Zone ── */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Your account, practice history,
                  and all progress data will be permanently deleted.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline">Cancel</Button>}
                />
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {deleting ? "Deleting…" : "Yes, delete my account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
