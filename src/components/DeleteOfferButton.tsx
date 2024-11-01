"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface DeleteOfferButtonProps {
  domain: string;
  timestamp: string;
  onDelete: (domain: string, timestamp: string) => Promise<void>;
}

export function DeleteOfferButton({
  domain,
  timestamp,
  onDelete,
}: DeleteOfferButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    startTransition(async () => {
      await onDelete(domain, timestamp);
      router.refresh();
      setIsConfirming(false);
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      onMouseLeave={() => setIsConfirming(false)}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
        isConfirming
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Trash2 className="w-3 h-3" />
      {isPending ? "..." : isConfirming ? "Confirm" : "Delete"}
    </button>
  );
}
