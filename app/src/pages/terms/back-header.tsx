import { useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

// The header the three static pages share: a plain link home (a full page load, as the original does it) and the theme toggle.
export function BackHeader({ className }: { className: string }) {
  return (
    <header className="border-b border-border">
      <div className={className}>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
