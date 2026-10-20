"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useLook } from "@/app/look-context";
import { ItemImage } from "@/components/ItemImage";
import { SubpageHeader } from "@/components/SubpageHeader";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import { toHex } from "@/lib/color";
import { colorName } from "@/lib/colorNames";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { ClothingItem } from "@/lib/types";

/// One wardrobe piece: big picture, its details, edit and delete.
export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const look = useLook();
  const [item, setItem] = useState<ClothingItem | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.listItems().then((items) => {
      setItem(items.find((i) => i.id === id) ?? null);
    });
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this piece? It will also be removed from any saved outfits.")) return;
    setDeleting(true);
    try {
      await api.deleteItem(id);
      router.push("/wardrobe");
    } catch {
      setDeleting(false);
    }
  }

  if (item === undefined) {
    return <p className="px-5 py-10 text-center text-sm text-muted">Loading…</p>;
  }
  if (item === null) {
    return (
      <div className="flex flex-col">
        <SubpageHeader title="Not found" onBack={() => router.push("/wardrobe")} />
        <p className="px-5 py-10 text-center text-sm text-muted">
          This piece isn&apos;t in your wardrobe.
        </p>
      </div>
    );
  }

  const Icon = CATEGORY_ICONS[item.category];
  const title = item.name ?? CATEGORY_LABELS[item.category];

  return (
    <div className="flex flex-1 flex-col pb-10">
      <SubpageHeader
        title={title}
        actions={
          <Link
            href={`/wardrobe/${item.id}/edit`}
            aria-label="Edit"
            className="rounded-control p-2 text-ink hover:bg-surface-2"
          >
            <Pencil size={18} />
          </Link>
        }
      />

      <div className="flex flex-col gap-6 px-5 pt-2 md:flex-row md:items-start md:gap-10">
        <ItemImage
          id={item.id}
          alt={title}
          padding="p-6"
          className={`w-full rounded-card md:max-w-md ${
            look === "colour" ? "aspect-[3/4]" : "aspect-square"
          }`}
        />

        <div className="flex flex-1 flex-col">
          <dl className="divide-y divide-line border-y border-line text-sm">
            <div className="flex items-center justify-between py-3">
              <dt className="text-muted">Category</dt>
              <dd className="flex items-center gap-2 font-medium">
                <Icon size={15} /> {CATEGORY_LABELS[item.category]}
              </dd>
            </div>
            {item.dominantColor !== null ? (
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted">Colour</dt>
                <dd className="flex items-center gap-2 font-medium capitalize">
                  <span
                    className="h-4 w-4 rounded-full ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: toHex(item.dominantColor) }}
                  />
                  {colorName(item.dominantColor)}
                </dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between py-3">
              <dt className="text-muted">Added</dt>
              <dd className="font-medium">
                {new Date(item.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>

          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
            icon={<Trash2 size={16} />}
            className="mt-8 self-start"
          >
            {deleting ? "Deleting…" : "Delete piece"}
          </Button>
        </div>
      </div>
    </div>
  );
}
