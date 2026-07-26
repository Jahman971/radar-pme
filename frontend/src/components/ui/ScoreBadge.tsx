'use client';
import { scoreColor, scoreLabel } from '@/lib/api';
import clsx from 'clsx';

interface ScoreBadgeProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const color = scoreColor(score);
  const label = scoreLabel(score);

  const colorClasses = {
    green: 'bg-green-50 text-green-800 border-green-200',
    orange: 'bg-orange-50 text-orange-800 border-orange-200',
    red: 'bg-red-50 text-red-800 border-red-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        colorClasses[color],
        sizeClasses[size],
      )}
    >
      <span className={clsx(
        'inline-block w-2 h-2 rounded-full',
        { 'bg-green-500': color === 'green', 'bg-orange-500': color === 'orange', 'bg-red-500': color === 'red' }
      )} />
      {score !== null ? `${score}/100` : '—'} · {label}
    </span>
  );
}

interface ScoreBarProps {
  score: number | null;
}

export function ScoreBar({ score }: ScoreBarProps) {
  const color = scoreColor(score);
  const pct = score ?? 0;

  const barColor = {
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', barColor[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8 text-right">{pct}</span>
    </div>
  );
}
