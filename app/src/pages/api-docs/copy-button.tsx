import { useState } from "react";

// Copies the text and reads "Copied" for two seconds.
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    // A browser may refuse clipboard access; the label still changes, as on the original.
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="text-xs text-muted-foreground hover:text-foreground transition px-2 py-1 rounded bg-secondary shrink-0"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
