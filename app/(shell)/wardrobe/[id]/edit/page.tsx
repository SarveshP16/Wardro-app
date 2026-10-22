"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ItemImage } from "@/components/ItemImage";
import { SubpageHeader } from "@/components/SubpageHeader";
import { Button } from "@/components/ui/Button";
import { CategorySelector } from "@/components/wardrobe/CategorySelector";
import { api } from "@/lib/api";
import { primaryCategory } from "@/lib/categories";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { ClothingCategory, ClothingItem } from "@/lib/types";

/// Change a piece's category or name.
export default function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ClothingItem | null | undefined>(undefined);
  const [categories, setCategories] = useState<ClothingCategory[]>(["top"]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listItems().then((items) => {
      const found = items.find((i) => i.id === id) ?? null;
      setItem(found);
      if (found) {
        setCategories(found.categories);
        setName(found.name ?? "");
      }
    });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await api.updateItem(id, { categories, name: name.trim() || null });
      router.push(`/wardrobe/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (item === undefined) {
    return <p className="px-5 py-10 text-center text-sm text-muted">Loading…</p>;
  }
  if (item === null) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted">
        This piece isn&apos;t in your wardrobe.
      </p>
    );
  }

  return (
    <div className="flex flex-1 flex-col pb-10">
      <SubpageHeader title="Edit piece" />

      <div className="flex flex-col gap-6 px-5 pt-2 md:max-w-lg">
        <ItemImage
          id={item.id}
          alt={item.name ?? CATEGORY_LABELS[primaryCategory(item)]}
          padding="p-4"
          className="aspect-square w-40 rounded-card"
        />

        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold">Category</p>
          <CategorySelector value={categories} onChange={setCategories} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold" htmlFor="edit-name">
            Name <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Blue denim jacket"
            className="w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button onClick={handleSave} disabled={saving} className="md:self-start">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
