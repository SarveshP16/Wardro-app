"use client";

import { Plus, Shirt } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CategoryFilterBar } from "@/components/wardrobe/CategoryFilterBar";
import { WardrobeGrid } from "@/components/wardrobe/WardrobeGrid";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { api } from "@/lib/api";
import type { ClothingCategory, ClothingItem } from "@/lib/types";

/// Port of `wardrobe_screen.dart`.
export default function WardrobePage() {
  const [items, setItems] = useState<ClothingItem[] | null>(null);
  const [category, setCategory] = useState<ClothingCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listItems()
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  const filtered =
    items?.filter((item) => category === null || item.category === category) ??
    [];

  return (
    <div className="flex flex-1 flex-col">
      <SectionHeader
        title="Wardrobe"
        subtitle={
          items ? `${items.length} item${items.length === 1 ? "" : "s"}` : undefined
        }
        trailing={
          <Link
            href="/wardrobe/add"
            aria-label="Add a wardrobe item"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong"
          >
            <Plus size={20} />
          </Link>
        }
      />

      {items && items.length > 0 ? (
        <CategoryFilterBar selected={category} onChange={setCategory} />
      ) : null}

      {error ? <p className="px-5 py-3 text-sm text-red-600">{error}</p> : null}

      {items === null ? (
        <p className="px-5 py-10 text-center text-sm text-foreground/50">
          Loading…
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Shirt size={48} strokeWidth={1.25} />}
          title="Your wardrobe is empty"
          message="Add a few items to get outfit suggestions."
          action={
            <Link
              href="/wardrobe/add"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
            >
              <Plus size={16} /> Add a wardrobe item
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Shirt size={48} strokeWidth={1.25} />}
          title="No items in this category"
        />
      ) : (
        <WardrobeGrid items={filtered} />
      )}
    </div>
  );
}
