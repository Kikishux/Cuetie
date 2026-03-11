"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

/* ───────────────────────── animation helper ───────────────────────── */

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────── conversation mockup ───────────────────────── */

function ConversationMockup() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm ring-1 ring-border/30">
      {/* Header bar — coaching identity */}
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-base">☕</span>
          <span className="text-base font-medium text-foreground">
            First Coffee Date
          </span>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          Practice mode
        </span>
      </div>

      {/* Messages */}
      <div className="space-y-3 p-5">
        {/* Them */}
        <div className="flex gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            A
          </div>
          <div className="rounded-xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-base text-foreground">
            So what do you like to do on weekends?
          </div>
        </div>

        {/* You — warm accent */}
        <div className="flex justify-end">
          <div className="rounded-xl rounded-tr-sm bg-primary/10 px-3.5 py-2.5 text-base text-foreground ring-1 ring-primary/15">
            I mostly hike and read. How about you?
          </div>
        </div>

        {/* Them */}
        <div className="flex gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            A
          </div>
          <div className="rounded-xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-base text-foreground">
            Oh nice! I love hiking too. Any favorite trails?
          </div>
        </div>
      </div>

      {/* Coach tip — brand motif */}
      <div className="mx-5 rounded-b-xl bg-primary/[0.05] px-5 py-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-base">💝</span>
          <p className="text-sm leading-relaxed text-foreground/70">
            <span className="font-semibold text-primary/80">Coach tip:</span>{" "}
            Great open question! Try sharing a specific trail name to deepen the
            connection.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── data ───────────────────────── */

const steps = [
  {
    num: "01",
    emoji: "☕",
    title: "Pick a scenario",
    desc: "Choose a situation — first dates, texting after a date, handling rejection, and more.",
  },
  {
    num: "02",
    emoji: "💬",
    title: "Practice the conversation",
    desc: "Chat with an AI partner who responds realistically. Your coach watches and helps in real time.",
    featured: true,
  },
  {
    num: "03",
    emoji: "✨",
    title: "Get kind, clear feedback",
    desc: "See what went well and what to try differently — specific examples, not vague advice.",
  },
];

/* ───────────────────────── page ───────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-32 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Cuetie — Your dating communication coach"
              width={120}
              height={120}
              className="h-[120px] w-[120px]"
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-base">
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="text-base">
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════ SECTION 1: HERO ═══════════════════════ */}
      <section className="px-5 sm:px-8">
        <div className="mx-auto max-w-5xl pt-12 pb-12 sm:pt-18 sm:pb-14 lg:pb-18">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.85fr] lg:gap-14">
            {/* Left column: copy */}
            <div>
              <FadeUp delay={0.06}>
                <h1 className="max-w-[18ch] text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl sm:max-w-[20ch] lg:text-[3.25rem]">
                  Practice dating conversations before they happen
                </h1>
              </FadeUp>

              <FadeUp delay={0.12}>
                <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  A safe, private space to rehearse what to say, understand
                  social cues, and build confidence — at your own pace.
                </p>
              </FadeUp>

              {/* Brand motif — editorial callout */}
              <FadeUp delay={0.15}>
                <div className="mt-3 flex items-center gap-2 text-sm font-medium tracking-wide text-primary/60">
                  <span>Clear</span>
                  <span className="text-primary/30">·</span>
                  <span>Kind</span>
                  <span className="text-primary/30">·</span>
                  <span>Concrete</span>
                </div>
              </FadeUp>

              <FadeUp delay={0.18}>
                <div className="mt-6">
                  <Link href="/login" className="block sm:inline-block">
                    <Button
                      size="lg"
                      className="h-12 w-full text-base sm:w-auto sm:px-8"
                    >
                      Start practicing free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </FadeUp>

              <FadeUp delay={0.22}>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-muted-foreground">
                  <span>✓ Free to start</span>
                  <span>✓ Private &amp; judgment-free</span>
                  <span>✓ Go at your own pace</span>
                </div>
              </FadeUp>
            </div>

            {/* Right column: conversation mockup — desktop only */}
            <FadeUp delay={0.1} className="hidden lg:block">
              <ConversationMockup />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SECTION 2: HOW IT WORKS ═══════════════════════ */}
      <section
        id="how-it-works"
        className="border-t border-border/40 bg-muted/25 px-5 sm:px-8"
      >
        <div className="mx-auto max-w-5xl py-10 sm:py-14">
          <FadeUp>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Three steps, no pressure.
            </p>
          </FadeUp>

          {/* Cards with hierarchy — middle card featured */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((s, i) => (
              <FadeUp key={s.title} delay={i * 0.08}>
                <div
                  className={`relative flex h-full flex-col rounded-xl p-5 transition-shadow ${
                    s.featured
                      ? "border-2 border-primary/20 bg-card shadow"
                      : "border border-border/60 bg-card/80"
                  }`}
                >
                  {/* Step number */}
                  <span className="text-xs font-bold tracking-widest text-primary/40">
                    {s.num}
                  </span>
                  <span className="mt-2 text-2xl">{s.emoji}</span>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                  {/* Featured badge */}
                  {s.featured && (
                    <span className="absolute -top-3 right-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary/80 shadow-sm">
                      💝 Core experience
                    </span>
                  )}
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Step connector — subtle visual flow */}
          <FadeUp delay={0.3}>
            <div className="mt-6 hidden items-center justify-center gap-2 text-sm text-muted-foreground/60 sm:flex">
              <span>Pick</span>
              <span>→</span>
              <span>Practice</span>
              <span>→</span>
              <span>Grow</span>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════════════════ SECTION 3: TESTIMONIAL + CTA ═══════════════════════ */}
      <section className="border-t border-border/40 px-5 sm:px-8">
        <div className="mx-auto max-w-5xl py-10 sm:py-14">
          <FadeUp>
            <div className="mx-auto max-w-2xl">
              {/* Testimonial quote card */}
              <div className="rounded-xl bg-muted/30 px-6 py-6 sm:px-8 sm:py-8">
                <div className="relative">
                  {/* Decorative quote mark */}
                  <span
                    className="absolute -top-2 -left-1 text-5xl font-serif leading-none text-primary/15 select-none sm:text-6xl"
                    aria-hidden
                  >
                    &ldquo;
                  </span>
                  <p className="relative z-10 pl-6 text-lg italic leading-relaxed text-foreground/80 sm:pl-8 sm:text-xl">
                    Cuetie helped me understand why my messages weren&apos;t
                    getting responses. Now I feel so much more confident
                    texting.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pl-6 sm:pl-8">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      A
                    </div>
                    <div>
                      <p className="text-base font-medium text-foreground">
                        Alex R.
                        <span className="ml-2 text-xs font-normal text-muted-foreground/60">
                          · 1,200+ practice sessions across Cuetie
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Practicing for 3 months
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════════════════ SECTION 4: FINAL CTA ═══════════════════════ */}
      <section className="border-t border-border/40 bg-primary/[0.04] px-5 sm:px-8">
        <div className="mx-auto max-w-2xl py-10 text-center sm:py-12">
          <FadeUp>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to try it?
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Your first conversation is free — takes about 2 minutes.
            </p>
            <div className="mt-6">
              <Link href="/login" className="block sm:inline-block">
                <Button
                  size="lg"
                  className="h-12 w-full text-base sm:w-auto sm:px-8"
                >
                  Start a practice conversation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground/70">
              No account needed · No judgment · Your pace
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Cuetie"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-base font-bold text-foreground">Cuetie</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-5 text-base">
            <a href="mailto:hello@cuetie.app" className="transition-colors hover:text-foreground">
              Contact
            </a>
            <a href="/login" className="transition-colors hover:text-foreground">
              Log in
            </a>
          </nav>
          <p className="text-sm">© {new Date().getFullYear()} Cuetie</p>
        </div>
      </footer>
    </div>
  );
}
