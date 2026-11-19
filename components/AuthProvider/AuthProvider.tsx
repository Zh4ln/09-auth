"use client";

import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkSession, getMe } from "@/lib/api/clientApi";
import { useAuthStore } from "@/lib/store/authStore";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const clearIsAuthenticated = useAuthStore(
    (state) => state.clearIsAuthenticated,
  );

  const { data, isError, isSuccess } = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const sessionUser = await checkSession();
      if (!sessionUser) return null;
      return await getMe();
    },
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isSuccess && data) setUser(data);
    else if (isError || (isSuccess && !data)) clearIsAuthenticated();
  }, [isError, isSuccess, data, setUser, clearIsAuthenticated]);

  return <>{children}</>;
}
