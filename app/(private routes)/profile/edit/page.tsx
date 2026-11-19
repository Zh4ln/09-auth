"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { updateMe } from "@/lib/api/clientApi";
import { useAuthStore } from "@/lib/store/authStore";
import css from "@/components/Profile/Profile.module.css";

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const username = String(data.get("username") || "").trim();
    if (!username) {
      setError("Username is required");
      return;
    }
    setPending(true);
    setError("");
    try {
      const updatedUser = await updateMe({ username });
      setUser(updatedUser);
      queryClient.setQueryData(["auth", "session"], updatedUser);
      router.replace("/profile");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to save profile",
      );
    } finally {
      setPending(false);
    }
  }

  if (!user) {
    return (
      <main className={css.mainContent}>
        <p>Loading profile…</p>
      </main>
    );
  }

  return (
    <main className={css.mainContent}>
      <div className={css.profileCard}>
        <h1 className={css.formTitle}>Edit Profile</h1>
        <div className={css.avatarWrapper}>
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt="User Avatar"
              width={120}
              height={120}
              className={css.avatar}
            />
          ) : (
            <div className={css.avatarPlaceholder}>?</div>
          )}
        </div>
        <form className={css.profileInfo} onSubmit={handleSubmit}>
          <div className={css.usernameWrapper}>
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              name="username"
              type="text"
              className={css.input}
              defaultValue={user?.username ?? ""}
              required
            />
          </div>
          <p>Email: {user?.email ?? ""}</p>
          <div className={css.actions}>
            <button className={css.saveButton} type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              className={css.cancelButton}
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className={css.error} role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
