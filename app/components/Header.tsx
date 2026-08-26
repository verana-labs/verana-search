import NetworkChip from "./NetworkChip";
import ThemeToggle from "./ThemeToggle";

export default function Header({ networkLabel }: { networkLabel: string }) {
  return (
    <header className="flex items-center justify-between py-5 border-b border-rule">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Verana" className="h-8 w-8" />
        <span className="wordmark text-xl">
          Verana<span className="text-primary">Graph</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <NetworkChip label={networkLabel} />
        <ThemeToggle />
      </div>
    </header>
  );
}
