"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useProfile } from "@/app/(shell)/profile-context";
import { useLook } from "@/app/look-context";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";

/// Top of each tab: the screen's title in the look's display type, an
/// optional subtitle and actions, and who's using the app -- tapping that
/// goes to the profile picker to switch person. (On wide screens the
/// sidebar shows the profile instead.)
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  const profile = useProfile();
  const look = useLook();

  return (
    <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-6 md:pt-10">
      <div className="min-w-0">
        <h1
          className={`display leading-[1.05] ${
            look === "colour" ? "text-[34px]" : "text-[26px]"
          }`}
        >
          {title}
        </h1>
        {subtitle ? (
          <div className="mt-1 text-[13px] text-muted">{subtitle}</div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {actions}
        <Link
          href="/profiles"
          aria-label={`Switch profile (${profile.name})`}
          className="flex items-center rounded-full md:hidden"
        >
          {look === "colour" ? (
            <span className="text-[13px] font-medium text-muted underline-offset-4 hover:underline">
              {profile.name}
            </span>
          ) : (
            <ProfileAvatar name={profile.name} color={profile.color} size={34} />
          )}
        </Link>
      </div>
    </header>
  );
}
