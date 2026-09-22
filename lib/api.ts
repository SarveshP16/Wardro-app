import type {
  ClothingCategory,
  ClothingItem,
  GeneratedOutfit,
  OutfitStyle,
  SavedOutfit,
  WeatherSnapshot,
} from "./types";

/// Thin typed client for the /api routes — every client component talks
/// to the server through here rather than calling `fetch` inline.

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error ?? `Request failed (${response.status}).`);
  }
  return body as T;
}

export const api = {
  listItems: () =>
    request<{ items: ClothingItem[] }>("/api/wardrobe/items").then(
      (r) => r.items,
    ),

  createItem: (data: {
    category: ClothingCategory;
    name?: string | null;
    dominantColor?: number | null;
    cutout: string;
  }) =>
    request<{ item: ClothingItem }>("/api/wardrobe/items", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.item),

  updateItem: (
    id: string,
    data: { name?: string | null; category?: ClothingCategory },
  ) =>
    request<{ item: ClothingItem }>(`/api/wardrobe/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }).then((r) => r.item),

  deleteItem: (id: string) =>
    request<{ ok: boolean }>(`/api/wardrobe/items/${id}`, {
      method: "DELETE",
    }),

  /// Uploads a raw photo for background removal + dominant-color
  /// extraction; nothing is persisted until createItem is called with
  /// the returned cutout.
  processPhoto: async (
    file: File,
  ): Promise<{ cutout: string; dominantColor: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/wardrobe/items/process", {
      method: "POST",
      body: formData,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.error ?? "Could not process this photo.");
    }
    return body;
  },

  generateAiOutfits: (data: {
    style: OutfitStyle;
    includeOuterwear: boolean;
    includeShoes: boolean;
    weather?: WeatherSnapshot | null;
  }) =>
    request<{ outfits: GeneratedOutfit[] }>("/api/outfits/generate/ai", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.outfits),

  listSavedOutfits: () =>
    request<{ outfits: SavedOutfit[] }>("/api/outfits/saved").then(
      (r) => r.outfits,
    ),

  saveOutfit: (data: { style: OutfitStyle; outfit: GeneratedOutfit }) =>
    request<{ outfit: SavedOutfit }>("/api/outfits/saved", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.outfit),

  deleteSavedOutfit: (id: string) =>
    request<{ ok: boolean }>(`/api/outfits/saved/${id}`, {
      method: "DELETE",
    }),

  getSettings: () => request<{ themeMode: string }>("/api/settings"),

  setThemeMode: (themeMode: string) =>
    request<{ themeMode: string }>("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ themeMode }),
    }),
};
