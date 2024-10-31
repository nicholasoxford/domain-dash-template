"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  domain: string;
  onDelete: (domain: string) => Promise<void>;
}

export function DeleteButton({ domain, onDelete }: DeleteButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    startTransition(async () => {
      await onDelete(domain);
      router.refresh();
      setIsConfirming(false);
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      onMouseLeave={() => setIsConfirming(false)}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isConfirming
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Trash2 className="w-4 h-4" />
      {isPending
        ? "Deleting..."
        : isConfirming
        ? "Click again to confirm"
        : "Delete Offers"}
    </button>
  );
}
