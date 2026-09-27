import React, { useState } from 'react';

interface HashBadgeProps {
  hash: string;
  label?: string;
  leadLength?: number;
  tailLength?: number;
  className?: string;
}

export const HashBadge: React.FC<HashBadgeProps> = ({
  hash,
  label,
  leadLength = 8,
  tailLength = 6,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  if (!hash) return <span className="text-slate-400 font-mono text-[11px]">-</span>;

  const displayHash =
    hash.length > leadLength + tailLength + 3
      ? `${hash.slice(0, leadLength)}...${hash.slice(-tailLength)}`
      : hash;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] group max-w-full ${className}`}
      title={`Click to copy full hash:\n${hash}`}
    >
      {label && <span className="text-slate-500 dark:text-slate-400 text-[10px]">{label}:</span>}
      <code className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/80 truncate font-semibold">
        {displayHash}
      </code>
      <button
        onClick={handleCopy}
        type="button"
        aria-label="Copy hash to clipboard"
        className="p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
      >
        <span className="material-symbols-outlined text-[13px]">
          {copied ? 'check' : 'content_copy'}
        </span>
      </button>
      {copied && (
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
          Copied!
        </span>
      )}
    </div>
  );
};
