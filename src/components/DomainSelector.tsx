"use client";

import { useRouter } from "next/navigation";

interface DomainSelectorProps {
  domains: string[];
  currentDomain: string;
}

export function DomainSelector({
  domains,
  currentDomain,
}: DomainSelectorProps) {
  const router = useRouter();

  return (
    <select
      value={currentDomain}
      onChange={(e) =>
        router.push(`/admin?domain=${encodeURIComponent(e.target.value)}`)
      }
      className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors"
    >
      <option value="all">All Domains</option>
      {domains.map((domain) => (
        <option key={domain} value={domain}>
          {domain}
        </option>
      ))}
    </select>
  );
}
