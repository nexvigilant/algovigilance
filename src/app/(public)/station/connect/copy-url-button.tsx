"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

export function CopyUrlButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
      title={copied ? "Copied!" : "Copy URL"}
      aria-label={`Copy ${text}`}
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}
