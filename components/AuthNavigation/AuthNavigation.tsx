"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { logout } from "@/lib/api/clientApi";
import { useAuthStore } from "@/lib/store/authStore";
import css from "./AuthNavigation.module.css";

export default function AuthNavigation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, clearIsAuthenticated } = useAuthStore();

  async function handleLogout() {
    try {
      await logout();
      clearIsAuthenticated();
      queryClient.clear();
      router.replace("/sign-in");
      router.refresh();
    } catch {
      toast.error("Could not log out. Please try again.");
    }
  }

  return (
    <ul className={css.navigation}>
      {isAuthenticated ? (
        <>
          <li>
            <Link href="/profile" prefetch={false}>
              Profile
            </Link>
          </li>
          <li className={css.email}>{user?.email}</li>
          <li>
            <button
              className={css.logoutButton}
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </li>
        </>
      ) : (
        <>
          <li>
            <Link href="/sign-in" prefetch={false}>
              Login
            </Link>
          </li>
          <li>
            <Link href="/sign-up" prefetch={false}>
              Register
            </Link>
          </li>
        </>
      )}
    </ul>
  );
}
