"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type {
  OnboardingProfile,
  GenderIdentity,
  DatingPreference,
  User,
} from "@/lib/types/database";
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

const genderOptions: { value: GenderIdentity; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "genderqueer", label: "Genderqueer" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
  { value: "other", label: "Other" },
];

const datingPreferenceOptions: { value: DatingPreference; label: string }[] = [
  { value: "male", label: "Men" },
  { value: "female", label: "Women" },
  { value: "non-binary", label: "Non-binary people" },
  { value: "genderqueer", label: "Genderqueer people" },
  { value: "no-preference", label: "No preference" },
];

/* ───────────────── component ───────────────── */

export default function SettingsPage() {
  const { user, signOut, refreshProfile } = useAuth();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [coachingStyle, setCoachingStyle] =
    useState<OnboardingProfile["preferred_coaching_style"]>("gentle");
  const [gender, setGender] = useState<GenderIdentity | undefined>(undefined);
  const [genderCustom, setGenderCustom] = useState("");
  const [datingPreference, setDatingPreference] = useState<DatingPreference | undefined>(undefined);
  const [subscriptionTier, setSubscriptionTier] = useState<User["subscription_tier"]>("free");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  /* ── fetch profile ── */
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const userId = user.id;

    async function fetchProfile() {
      const { data } = await supabase
        .from("users")
        .select("display_name, onboarding_profile, subscription_tier")
        .eq("id", userId)
        .single();

      if (cancelled) return;

      if (data) {
        setDisplayName(data.display_name ?? "");
        setSubscriptionTier(data.subscription_tier === "premium" ? "premium" : "free");
        const profile = data.onboarding_profile as OnboardingProfile | null;
        setCoachingStyle(profile?.preferred_coaching_style ?? "gentle");
        setGender(profile?.gender);
        setGenderCustom(profile?.gender_custom ?? "");
        setDatingPreference(profile?.dating_preference);
        setChallenges(profile?.challenges ?? []);
      }
      setLoading(false);
    }

    void fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

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
          gender,
          ...(gender === "other" && genderCustom.trim()
            ? { gender_custom: genderCustom.trim() }
            : { gender_custom: undefined }),
          dating_preference: datingPreference,
          challenges,
        },
      })
      .eq("id", user.id);

    await refreshProfile();
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

      <Card className={subscriptionTier === "premium" ? "border-primary/30 bg-primary/[0.03]" : undefined}>
        <CardHeader>
          <CardTitle className="text-base">Your Plan</CardTitle>
          <CardDescription>
            View your current subscription and available coaching features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge
            variant={subscriptionTier === "premium" ? "default" : "secondary"}
            className="w-fit"
          >
            {subscriptionTier === "premium" ? "✨ Premium Plan" : "Free Plan"}
          </Badge>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {subscriptionTier === "premium"
                ? "Unlimited premium coaching tools are active on your account."
                : "You&apos;re currently using Cuetie&apos;s free coaching tier."}
            </p>
            <p className="text-sm text-muted-foreground">
              {subscriptionTier === "premium"
                ? "You have access to all premium features."
                : "Upgrade to unlock unlimited Deep Emotion Analysis."}
            </p>
          </div>
        </CardContent>
      </Card>

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

      {/* ── Gender & Dating Preferences ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gender &amp; Dating Preferences</CardTitle>
          <CardDescription>
            This personalizes your practice conversations so they feel
            more realistic and relevant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>How do you identify?</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {genderOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  className={`rounded-lg border p-3 text-left text-sm transition-all ${
                    gender === opt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {gender === "other" && (
              <Input
                placeholder="How do you identify?"
                value={genderCustom}
                onChange={(e) => setGenderCustom(e.target.value)}
                className="max-w-sm"
              />
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Who are you interested in dating?</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {datingPreferenceOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDatingPreference(opt.value)}
                  className={`rounded-lg border p-3 text-left text-sm transition-all ${
                    datingPreference === opt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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
