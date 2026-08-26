import ThemeToggle from "./ThemeToggle";

export default function Header({ networkLabel }: { networkLabel: string }) {
  return (
    <header className="flex items-center justify-between py-5 border-b border-rule">
      <div className="flex items-center gap-3">
        <span className="wordmark text-xl">
          verana<span className="text-primary">.</span>
        </span>
        <span className="eyebrow">Search</span>
        <span className="chip">{networkLabel}</span>
      </div>
      <ThemeToggle />
    </header>
  );
}
