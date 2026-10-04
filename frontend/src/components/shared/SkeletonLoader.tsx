import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'chart' | 'avatar';
  className?: string;
}

export default function SkeletonLoader({ type = 'text', className }: SkeletonLoaderProps) {
  const baseClass = "animate-pulse bg-gray-200 dark:bg-slate-700/50 rounded";

  if (type === 'card') {
    return (
      <div className={cn(baseClass, "h-48 w-full rounded-xl", className)} />
    );
  }

  if (type === 'chart') {
    return (
      <div className={cn(baseClass, "h-[300px] w-full rounded-xl", className)} />
    );
  }

  if (type === 'avatar') {
    return (
      <div className={cn(baseClass, "h-12 w-12 rounded-full", className)} />
    );
  }

  // text
  return (
    <div className={cn(baseClass, "h-4 w-full", className)} />
  );
}
