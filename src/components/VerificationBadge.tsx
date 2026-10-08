import { BadgeCheck, Award, Crown, ShieldQuestion } from 'lucide-react';
import type { VerificationTier } from '@/types';

const TIER_STYLES: Record<VerificationTier, {
  icon: typeof BadgeCheck;
  label: string;
  classes: string;
  iconColor: string;
}> = {
  gold: {
    icon: Crown,
    label: 'Gold',
    classes: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500',
  },
  silver: {
    icon: Award,
    label: 'Silver',
    classes: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    iconColor: 'text-slate-400',
  },
  verified: {
    icon: BadgeCheck,
    label: 'Verified',
    classes: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500',
  },
  unverified: {
    icon: ShieldQuestion,
    label: 'Unverified',
    classes: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700',
    iconColor: 'text-neutral-400',
  },
};

export function VerificationBadge({ tier, size = 'sm' }: { tier: VerificationTier; size?: 'sm' | 'md' }) {
  const config = TIER_STYLES[tier];
  const Icon = config.icon;
  const sizeClasses = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`badge ${config.classes} ${sizeClasses}`}>
      <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
      {config.label}
    </span>
  );
}
