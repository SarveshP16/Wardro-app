"use client";

import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, type FormEvent } from "react";

import { useLook } from "@/app/look-context";
import { ProfileAvatar, ProfileColorPicker } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";
import { SpectrumStrip } from "@/components/wardrobe/SpectrumStrip";
import { api, type ProfileSummary } from "@/lib/api";
import {
  MAX_PROFILE_NAME_LENGTH,
  PROFILE_COLORS,
  type Profile,
  type ProfileColor,
} from "@/lib/types";

/// "Who's getting dressed?" -- pick a profile by name (no password; see
/// lib/profile.ts), add one, or rename/delete in edit mode. The choice is
/// remembered on this device until you switch again.
export default function ProfilesPage() {
  const look = useLook();
  const { setTheme } = useTheme();
  const [profiles, setProfiles] = useState<ProfileSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function applyProfiles(result: { profiles: ProfileSummary[]; activeId: string | null }) {
    setProfiles(result.profiles);
    setActiveId(result.activeId);
    if (result.profiles.length === 0) setAdding(true);
  }

  function showLoadError(err: unknown) {
    setLoadError(err instanceof Error ? err.message : "Could not load profiles.");
  }

  function load() {
    return api.listProfiles().then(applyProfiles).catch(showLoadError);
  }

  useEffect(() => {
    api.listProfiles().then(applyProfiles).catch(showLoadError);
  }, []);

  /// Full page load into the wardrobe, so the server renders it in the
  /// new profile's look and theme from the first paint.
  function enter(profile: Profile) {
    setTheme(profile.themeMode);
    // A full load (not router.push) on purpose: the root layout, which
    // sets the look, only re-renders on a real navigation.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/wardrobe");
  }

  async function select(profile: ProfileSummary) {
    setBusyId(profile.id);
    try {
      enter(await api.selectProfile(profile.id));
    } catch {
      setBusyId(null);
    }
  }

  async function remove(profile: ProfileSummary) {
    const pieces = `${profile.itemCount} piece${profile.itemCount === 1 ? "" : "s"}`;
    if (
      !confirm(
        `Delete ${profile.name}'s profile? Their wardrobe (${pieces}) and saved outfits are deleted too. This can't be undone.`,
      )
    ) {
      return;
    }
    await api.deleteProfile(profile.id).catch(() => {});
    await load();
  }

  const heading = profiles?.length === 0 ? "Who are you?" : "Who's getting dressed?";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-10 pt-14">
      <p className="display text-[13px] text-muted">Wardro</p>
      <h1
        className={`display mt-4 leading-[1.02] ${
          look === "colour" ? "text-[30px]" : "text-[34px]"
        }`}
      >
        {heading}
      </h1>
      {profiles?.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Wardro keeps a separate wardrobe for each person. Add yourself to
          get started.
        </p>
      ) : null}

      <div className={look === "colour" ? "mt-8 flex flex-col gap-7" : "mt-8 flex flex-col"}>
        {loadError ? <p className="text-sm text-danger">{loadError}</p> : null}
        {profiles === null && !loadError ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : null}

        {profiles?.map((profile) =>
          editing ? (
            <EditProfileRow
              key={profile.id}
              profile={profile}
              onSaved={load}
              onDelete={() => remove(profile)}
            />
          ) : (
            <button
              key={profile.id}
              type="button"
              onClick={() => select(profile)}
              disabled={busyId !== null}
              className={
                look === "colour"
                  ? "group text-left disabled:opacity-60"
                  : "flex items-center gap-4 border-t border-line py-3.5 text-left disabled:opacity-60"
              }
            >
              {look === "colour" ? (
                <ColourProfileName profile={profile} active={profile.id === activeId} />
              ) : (
                <>
                  <ProfileAvatar name={profile.name} color={profile.color} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-semibold">
                      {profile.name}
                    </span>
                    <span className="block text-[13px] text-muted">
                      {piecesLabel(profile.itemCount)}
                    </span>
                  </span>
                  {profile.id === activeId ? (
                    <Check size={18} className="text-muted" aria-label="Current profile" />
                  ) : null}
                </>
              )}
            </button>
          ),
        )}

        {adding ? (
          <NewProfileForm
            first={profiles?.length === 0}
            onCancel={profiles?.length ? () => setAdding(false) : undefined}
            onCreated={enter}
          />
        ) : profiles && !editing ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={
              look === "colour"
                ? "flex items-center gap-2 text-sm font-semibold"
                : "flex items-center gap-4 border-y border-line py-3.5 text-left text-muted hover:text-ink"
            }
          >
            {look === "colour" ? (
              <>
                <Plus size={16} /> New profile
              </>
            ) : (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-dashed border-muted">
                  <Plus size={20} />
                </span>
                <span className="text-[17px] font-semibold">Add a person</span>
              </>
            )}
          </button>
        ) : null}
      </div>

      {profiles && profiles.length > 0 && !adding ? (
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="mt-8 self-start text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
        >
          {editing ? "Done" : "Edit profiles"}
        </button>
      ) : null}
    </main>
  );
}

function piecesLabel(count: number): string {
  return count === 0 ? "Empty wardrobe" : `${count} piece${count === 1 ? "" : "s"}`;
}

/// Colour story's profile entry: the name set large, with a stripe of
/// that wardrobe's colours under it.
function ColourProfileName({
  profile,
  active,
}: {
  profile: ProfileSummary;
  active: boolean;
}) {
  return (
    <>
      <span
        className={`display block text-[40px] leading-none transition-colors group-hover:text-ink ${
          active ? "text-ink" : "text-muted"
        }`}
      >
        {profile.name}
      </span>
      <SpectrumStrip colors={profile.colors} className="mt-2.5 h-1.5" />
      <span className="mt-1.5 block text-[12.5px] text-muted">
        {piecesLabel(profile.itemCount)}
      </span>
    </>
  );
}

function NewProfileForm({
  first,
  onCancel,
  onCreated,
}: {
  first: boolean;
  onCancel?: () => void;
  onCreated: (profile: Profile) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<ProfileColor>(
    () => (Object.keys(PROFILE_COLORS) as ProfileColor[])[Math.floor(Math.random() * 6)],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      onCreated(await api.createProfile({ name, color }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the profile.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        <ProfileAvatar name={name || "?"} color={color} size={44} />
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={first ? "Your name" : "Name"}
          aria-label="Name"
          maxLength={MAX_PROFILE_NAME_LENGTH}
          className="min-w-0 flex-1 rounded-control border border-line bg-background px-3.5 py-2.5 text-[15px] outline-none focus:border-primary"
        />
      </div>
      <ProfileColorPicker value={color} onChange={setColor} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={saving || !name.trim()} className="flex-1">
          {saving ? "Adding…" : first ? "Get started" : "Add profile"}
        </Button>
      </div>
    </form>
  );
}

function EditProfileRow({
  profile,
  onSaved,
  onDelete,
}: {
  profile: ProfileSummary;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState<ProfileColor>(profile.color);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.updateProfile(profile.id, { name, color });
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3 border-t border-line py-3 last-of-type:border-b">
        <ProfileAvatar name={profile.name} color={profile.color} size={40} />
        <span className="min-w-0 flex-1 truncate text-[16px] font-semibold">
          {profile.name}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Edit ${profile.name}`}
          className="rounded-control p-2 text-muted hover:bg-surface-2 hover:text-ink"
        >
          <Pencil size={17} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${profile.name}`}
          className="rounded-control p-2 text-muted hover:bg-surface-2 hover:text-danger"
        >
          <Trash2 size={17} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="my-2 flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        <ProfileAvatar name={name || "?"} color={color} size={44} />
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Name"
          maxLength={MAX_PROFILE_NAME_LENGTH}
          className="min-w-0 flex-1 rounded-control border border-line bg-background px-3.5 py-2.5 text-[15px] outline-none focus:border-primary"
        />
      </div>
      <ProfileColorPicker value={color} onChange={setColor} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name.trim()} className="flex-1">
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
