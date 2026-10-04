import InfoTooltip from './InfoTooltip';

export default function DisclaimerBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800/50">
      <span>Association, not causation</span>
      <InfoTooltip content="This model finds statistical correlations but cannot prove that changes in inputs directly cause changes in yield." />
    </div>
  );
}
