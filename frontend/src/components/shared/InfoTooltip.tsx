import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
}

export default function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none">
            <Info className="h-4 w-4" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 rounded shadow-lg text-sm max-w-xs animate-in fade-in zoom-in"
            sideOffset={5}
          >
            {content}
            <Tooltip.Arrow className="fill-slate-800 dark:fill-slate-100" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
