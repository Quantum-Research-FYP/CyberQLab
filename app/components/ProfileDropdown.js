"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { CaretDown, User } from "@phosphor-icons/react";
import LogoutButton from "./LogoutButton";

export default function ProfileDropdown({ user, onOpenProfile }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const panelId = useId();
  const name = user?.name || "My account";
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();

  useEffect(() => {
    if (!open) return;
    const closeOutside = event => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return <div className="profile-dropdown" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button className="profile-dropdown-trigger" type="button" ref={trigger} aria-label="Profile options" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}>
      <span className="profile-dropdown-avatar" aria-hidden="true">{initials}</span>
      <span className="profile-dropdown-name">{name}</span>
      <CaretDown size={14} weight="bold" aria-hidden="true"/>
    </button>
    {open && <div className="profile-dropdown-panel" id={panelId}>
      <div className="profile-dropdown-identity"><strong>{name}</strong><span>{user?.email}</span></div>
      <nav aria-label="Account options">
        <Link href="/profile" prefetch={false} aria-label="View your profile" onClick={async event => { await onOpenProfile(event); setOpen(false); }}><User size={17} aria-hidden="true"/> My profile</Link>
        <LogoutButton/>
      </nav>
    </div>}
  </div>;
}
