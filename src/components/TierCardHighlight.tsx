import type { VerificationTier } from '@/types';

export function TierCardHighlight({
  tier,
  children,
}: {
  tier: VerificationTier;
  children: React.ReactNode;
}) {
  const highlightClasses: Record<VerificationTier, string> = {
    gold: 'ring-2 ring-amber-300 dark:ring-amber-700 bg-white dark:bg-neutral-900 rounded-xl border border-amber-200 dark:border-amber-800',
    silver: 'ring-1 ring-slate-300 dark:ring-slate-600 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-slate-700',
    verified: 'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800',
    unverified: 'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800',
  };

  return <div className={highlightClasses[tier]}>{children}</div>;
}
