"use client";

export function DomainSelector({
  domains,
  currentDomain,
}: {
  domains: string[];
  currentDomain: string;
}) {
  return (
    <div className="relative">
      <select
        value={currentDomain}
        onChange={(e) => {
          window.location.href = `/admin?domain=${e.target.value}`;
        }}
        className="bg-slate-800 text-slate-200 px-4 py-2 pr-8 rounded-lg 
          appearance-none cursor-pointer hover:bg-slate-700 
          transition-colors relative"
      >
        {domains.map((domain) => (
          <option key={domain} value={domain}>
            {domain}
          </option>
        ))}
      </select>

      {/* Dropdown Arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="h-4 w-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
