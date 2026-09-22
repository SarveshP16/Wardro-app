"use client";

import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ItemImage } from "@/components/ItemImage";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import { toHex } from "@/lib/color";
import { api } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { ClothingItem } from "@/lib/types";

/// Port of `item_detail_screen.dart`.
export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ClothingItem | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.listItems().then((items) => {
      setItem(items.find((i) => i.id === id) ?? null);
    });
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this item? This can't be undone.")) return;
    setDeleting(true);
    try {
      await api.deleteItem(id);
      router.push("/wardrobe");
    } catch {
      setDeleting(false);
    }
  }

  if (item === undefined) {
    return (
      <p className="px-5 py-10 text-center text-sm text-foreground/50">
        Loading…
      </p>
    );
  }
  if (item === null) {
    return (
      <p className="px-5 py-10 text-center text-sm text-foreground/50">
        Item not found.
      </p>
    );
  }

  const Icon = CATEGORY_ICONS[item.category];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 px-5 py-4">
        <button
          onClick={() => router.back()}
          className="text-foreground/70 hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 truncate font-serif text-lg font-semibold">
          {item.name ?? CATEGORY_LABELS[item.category]}
        </h1>
        <Link
          href={`/wardrobe/${item.id}/edit`}
          className="text-foreground/70 hover:text-foreground"
        >
          <Pencil size={18} />
        </Link>
      </header>

      <ItemImage
        id={item.id}
        alt={item.name ?? item.category}
        className="mx-5 aspect-square rounded-2xl"
      />

      <div className="flex flex-col gap-3 px-5 py-5">
        <div className="flex items-center gap-2 text-sm text-foreground/70">
          <Icon size={16} /> {CATEGORY_LABELS[item.category]}
        </div>
        {item.dominantColor !== null ? (
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <span
              className="h-4 w-4 rounded-full border border-outline"
              style={{ backgroundColor: toHex(item.dominantColor) }}
            />
            Dominant color
          </div>
        ) : null}
        <p className="text-xs text-foreground/45">
          Added {new Date(item.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="mt-auto px-5 pb-6">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={16} /> {deleting ? "Deleting…" : "Delete item"}
        </button>
      </div>
    </div>
  );
}
