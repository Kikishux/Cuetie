"use client";

import { type ComponentProps, forwardRef } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { useSensoryOptional } from "@/components/shared/SensoryProvider";

type MotionDivProps = ComponentProps<typeof motion.div>;

/**
 * A motion.div wrapper that respects sensory preferences.
 * In reduced-motion modes: fast opacity-only transitions.
 * In quiet-session: no animation at all.
 */
export const SafeMotion = forwardRef<HTMLDivElement, MotionDivProps>(
  function SafeMotion(props, ref) {
    const { reducedMotion, isQuietSession } = useSensoryOptional();

    if (isQuietSession) {
      // No animation — render as plain div
      const { initial, animate, exit, transition, whileHover, whileTap, whileInView, ...rest } = props;
      return <div ref={ref} {...(rest as React.HTMLAttributes<HTMLDivElement>)} />;
    }

    if (reducedMotion) {
      // Opacity-only, fast
      const reducedTransition: Transition = { duration: 0.1, ease: "easeOut" };
      return (
        <motion.div
          ref={ref}
          {...props}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reducedTransition}
        />
      );
    }

    // Full animation — pass through
    return <motion.div ref={ref} {...props} />;
  }
);

/**
 * AnimatePresence wrapper that becomes a no-op in quiet-session mode.
 */
export function SafeAnimatePresence({
  children,
  ...props
}: ComponentProps<typeof AnimatePresence>) {
  const { isQuietSession } = useSensoryOptional();

  if (isQuietSession) {
    return <>{children}</>;
  }

  return <AnimatePresence {...props}>{children}</AnimatePresence>;
}
