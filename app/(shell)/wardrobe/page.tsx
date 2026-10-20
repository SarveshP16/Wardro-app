"use client";

import { ArrowDownUp, Plus, Shirt } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useLook } from "@/app/look-context";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { SpectrumStrip } from "@/components/wardrobe/SpectrumStrip";
import { WardrobeGrid } from "@/components/wardrobe/WardrobeGrid";
import { api } from "@/lib/api";
import { compareByColor } from "@/lib/colorNames";
import {
  CLOTHING_CATEGORIES,
  type ClothingCategory,
  type ClothingItem,
} from "@/lib/types";

type Filter = ClothingCategory | "all";
type Sort = "newest" | "colour";

const PLURAL_LABELS: Record<ClothingCategory, string> = {
  top: "Tops",
  bottom: "Bottoms",
  outerwear: "Outerwear",
  shoes: "Shoes",
};

/// The Wardrobe tab. In Tailor's navy, "All" is laid out as one rail per
/// category; Colour story opens with a spectrum of everything you own and
/// defaults to sorting by colour.
export default function WardrobePage() {
  const look = useLook();
  const [items, setItems] = useState<ClothingItem[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>(look === "colour" ? "colour" : "newest");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listItems()
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  const counts = useMemo(() => {
    const result: Record<ClothingCategory, number> = {
      top: 0,
      bottom: 0,
      outerwear: 0,
      shoes: 0,
    };
    for (const item of items ?? []) result[item.category] += 1;
    return result;
  }, [items]);

  const visible = useMemo(() => {
    const filtered = (items ?? []).filter(
      (item) => filter === "all" || item.category === filter,
    );
    // The API already returns newest first.
    return sort === "colour"
      ? [...filtered].sort((a, b) => compareByColor(a.dominantColor, b.dominantColor))
      : filtered;
  }, [items, filter, sort]);

  const total = items?.length ?? 0;
  const pieces = `${total} piece${total === 1 ? "" : "s"}`;
  const showRails = look === "navy" && filter === "all" && sort === "newest";

  const addButton = (
    <Link
      href="/wardrobe/add"
      aria-label="Add pieces"
      className={buttonClasses("primary", "sm")}
    >
      <Plus size={16} />
      <span className="hidden sm:inline">Add</span>
    </Link>
  );

  return (
    <div className="flex flex-1 flex-col pb-10">
      <PageHeader
        title="Wardrobe"
        subtitle={items && look === "navy" ? pieces : undefined}
        actions={addButton}
      />

      {items && items.length > 0 ? (
        <>
          {look === "colour" ? (
            <div className="px-5 pb-1">
              <SpectrumStrip
                colors={items.flatMap((i) => (i.dominantColor !== null ? [i.dominantColor] : []))}
                className="h-3"
              />
              <p className="mt-1.5 text-xs text-muted">{pieces}</p>
            </div>
          ) : null}

          <Tabs<Filter>
            label="Category"
            value={filter}
            onChange={setFilter}
            className="mt-2"
            items={[
              { value: "all", label: "All", count: total },
              ...CLOTHING_CATEGORIES.map((c) => ({
                value: c,
                label: PLURAL_LABELS[c],
                count: counts[c],
              })),
            ]}
            trailing={
              <button
                type="button"
                onClick={() => setSort((s) => (s === "newest" ? "colour" : "newest"))}
                aria-label={`Sorted by ${sort === "newest" ? "newest" : "colour"}. Change sort`}
                className="flex items-center gap-1 rounded-control px-1.5 py-1 text-[12.5px] font-medium text-muted hover:text-ink"
              >
                <ArrowDownUp size={13} />
                {sort === "newest" ? "Newest" : "Colour"}
              </button>
            }
          />
        </>
      ) : null}

      {error ? <p className="px-5 py-3 text-sm text-danger">{error}</p> : null}

      {items === null ? (
        <p className="px-5 py-10 text-center text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Shirt size={44} strokeWidth={1.25} />}
          title="Your wardrobe is empty"
          message="Photograph a few pieces and Wardro will cut them out and start suggesting outfits."
          action={
            <Link href="/wardrobe/add" className={buttonClasses()}>
              <Plus size={16} /> Add your first piece
            </Link>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={`No ${PLURAL_LABELS[filter as ClothingCategory].toLowerCase()} yet`}
          action={
            <Link href="/wardrobe/add" className={buttonClasses("secondary")}>
              <Plus size={16} /> Add pieces
            </Link>
          }
        />
      ) : showRails ? (
        <div className="flex flex-col gap-2 pt-2">
          {CLOTHING_CATEGORIES.filter((c) => counts[c] > 0).map((category) => (
            <section key={category} aria-label={PLURAL_LABELS[category]}>
              <button
                type="button"
                onClick={() => setFilter(category)}
                className="flex w-full items-baseline justify-between px-5 pb-2 pt-4 text-left"
              >
                <h2 className="display text-[13px]">{PLURAL_LABELS[category]}</h2>
                <span className="text-xs text-muted">{counts[category]}</span>
              </button>
              <WardrobeGrid items={visible.filter((i) => i.category === category)} />
            </section>
          ))}
        </div>
      ) : (
        <div className="pt-4">
          <WardrobeGrid items={visible} />
        </div>
      )}
    </div>
  );
}
