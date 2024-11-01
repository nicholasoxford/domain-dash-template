"use client";

import { DomainStat } from "@/lib/kv-storage";
import { useState } from "react";

// Add these types at the top
type SortField =
  | "domain"
  | "visits"
  | "lastOffer"
  | "avgOffer"
  | "topOffer"
  | "offerCount";
type SortDirection = "asc" | "desc";

// Add this component for the sortable header
function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
}: {
  label: string;
  field: SortField;
  currentSort: { field: SortField; direction: SortDirection };
  onSort: (field: SortField) => void;
}) {
  return (
    <th
      onClick={() => onSort(field)}
      className="p-4 text-sm text-slate-400 cursor-pointer hover:text-purple-400 transition-colors"
    >
      <div className="flex items-center gap-1">
        {label}
        {currentSort.field === field && (
          <span className="text-purple-400">
            {currentSort.direction === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  );
}

// Modify the domain stats table section
export function DomainStatsTable({
  initialStats,
}: {
  initialStats: DomainStat[];
}) {
  const [stats, setStats] = useState(initialStats);
  const [sort, setSort] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: "offerCount",
    direction: "desc",
  });

  const handleSort = (field: SortField) => {
    // Calculate new sort state first
    const newSort: { field: SortField; direction: SortDirection } = {
      field,
      // If clicking the same field, cycle through: desc -> asc -> desc
      // If clicking a new field, start with desc
      direction:
        sort.field === field
          ? ((sort.direction === "desc" ? "asc" : "desc") as SortDirection)
          : "desc",
    };

    // Update sort state
    setSort(newSort);

    // Use the new sort state for sorting
    setStats((prev) =>
      [...prev].sort((a, b) => {
        let comparison = 0;

        switch (field) {
          case "domain":
            comparison = a.domain.localeCompare(b.domain);
            break;
          case "visits":
            comparison = a.visits - b.visits;
            break;
          case "lastOffer":
            comparison =
              (a.lastOffer?.getTime() || 0) - (b.lastOffer?.getTime() || 0);
            break;
          case "avgOffer":
            comparison = a.avgOffer - b.avgOffer;
            break;
          case "topOffer":
            comparison = a.topOffer - b.topOffer;
            break;
          case "offerCount":
            comparison = a.offerCount - b.offerCount;
            break;
        }

        return newSort.direction === "asc" ? comparison : -comparison;
      })
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-slate-200">
        <thead>
          <tr>
            <SortableHeader
              label="Domain"
              field="domain"
              currentSort={sort}
              onSort={handleSort}
            />
            <SortableHeader
              label="Total Offers"
              field="offerCount"
              currentSort={sort}
              onSort={handleSort}
            />
            <SortableHeader
              label="Total Views"
              field="visits"
              currentSort={sort}
              onSort={handleSort}
            />
            <SortableHeader
              label="Last Offer"
              field="lastOffer"
              currentSort={sort}
              onSort={handleSort}
            />
            <SortableHeader
              label="Avg Offer"
              field="avgOffer"
              currentSort={sort}
              onSort={handleSort}
            />
            <SortableHeader
              label="Top Offer"
              field="topOffer"
              currentSort={sort}
              onSort={handleSort}
            />
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => (
            <tr
              key={stat.domain}
              className="border-t border-slate-700 hover:bg-slate-800/30 transition-colors"
            >
              <td className="p-4 font-medium">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://${stat.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 group"
                  >
                    {stat.domain}
                    <svg
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </td>
              <td className="p-4">
                {stat.offerCount === 0 ? (
                  <span className="text-slate-500">-</span>
                ) : (
                  stat.offerCount.toLocaleString()
                )}
              </td>
              <td className="p-4">
                {stat.visits === 0 ? (
                  <span className="text-slate-500">-</span>
                ) : (
                  stat.visits.toLocaleString()
                )}
              </td>
              <td className="p-4">
                {stat.lastOffer ? (
                  stat.lastOffer.toLocaleDateString()
                ) : (
                  <span className="text-slate-500">No offers</span>
                )}
              </td>
              <td className="p-4">
                {stat.avgOffer === 0 ? (
                  <span className="text-slate-500">-</span>
                ) : (
                  `$${stat.avgOffer.toLocaleString()}`
                )}
              </td>
              <td className="p-4">
                {stat.topOffer === 0 ? (
                  <span className="text-slate-500">-</span>
                ) : (
                  `$${stat.topOffer.toLocaleString()}`
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
