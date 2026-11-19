"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { register, getMe } from "@/lib/api/clientApi";
import { useAuthStore } from "@/lib/store/authStore";
import css from "../auth.module.css";

export default function SignUpPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    setPending(true);
    setError("");
    try {
      await register({ email, password });
      const user = await getMe();
      setUser(user);
      queryClient.setQueryData(["auth", "session"], user);
      router.replace("/profile");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={css.mainContent}>
      <h1 className={css.formTitle}>Sign up</h1>
      <form className={css.form} onSubmit={handleSubmit}>
        <div className={css.formGroup}>
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            name="email"
            className={css.input}
            autoComplete="email"
            required
          />
        </div>
        <div className={css.formGroup}>
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            name="password"
            className={css.input}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <div className={css.actions}>
          <button type="submit" className={css.submitButton} disabled={pending}>
            {pending ? "Registering…" : "Register"}
          </button>
        </div>
        {error && (
          <p className={css.error} role="alert">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
