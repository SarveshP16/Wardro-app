"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ItemImage } from "@/components/ItemImage";
import { Button } from "@/components/ui/Button";
import { CategorySelector } from "@/components/wardrobe/CategorySelector";
import { api } from "@/lib/api";
import type { ClothingCategory, ClothingItem } from "@/lib/types";

/// Port of `edit_item_screen.dart`.
export default function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ClothingItem | null | undefined>(undefined);
  const [category, setCategory] = useState<ClothingCategory>("top");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listItems().then((items) => {
      const found = items.find((i) => i.id === id) ?? null;
      setItem(found);
      if (found) {
        setCategory(found.category);
        setName(found.name ?? "");
      }
    });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await api.updateItem(id, { category, name: name.trim() || null });
      router.push(`/wardrobe/${id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save changes.",
      );
    } finally {
      setSaving(false);
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

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 px-5 py-4">
        <button
          onClick={() => router.back()}
          className="text-foreground/70 hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-center font-serif text-lg font-semibold">
          Edit item
        </h1>
        <span className="w-5" />
      </header>

      <ItemImage
        id={item.id}
        alt={item.name ?? item.category}
        className="mx-5 aspect-square rounded-2xl"
      />

      <div className="flex flex-1 flex-col gap-5 px-5 py-5">
        <div>
          <p className="mb-2 text-sm font-semibold">Category</p>
          <CategorySelector value={category} onChange={setCategory} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="edit-name">
            Name (optional)
          </label>
          <input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-outline bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button onClick={handleSave} disabled={saving} className="mt-auto">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
