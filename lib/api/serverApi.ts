import { cookies } from "next/headers";
import { api } from "./api";
import { normalizeNotesResponse } from "./clientApi";
import type { FetchNotesParams, FetchNotesResponse } from "./clientApi";
import type { Note } from "@/types/note";
import type { User } from "@/types/user";

async function cookieHeaders(): Promise<{ Cookie: string }> {
  return { Cookie: (await cookies()).toString() };
}

export async function fetchNotes(
  params: FetchNotesParams,
): Promise<FetchNotesResponse> {
  const { data } = await api.get<Note[] | FetchNotesResponse>("/notes", {
    headers: await cookieHeaders(),
    params: {
      page: params.page,
      perPage: params.perPage,
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      ...(params.tag ? { tag: params.tag } : {}),
    },
  });
  return normalizeNotesResponse(data, params.page, params.perPage);
}

export async function fetchNoteById(id: Note["id"]): Promise<Note> {
  const { data } = await api.get<Note>(`/notes/${encodeURIComponent(id)}`, {
    headers: await cookieHeaders(),
  });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me", {
    headers: await cookieHeaders(),
  });
  return data;
}

export async function checkSession(
  cookie?: string,
  origin?: string,
): Promise<User | null> {
  const cookieValue = cookie ?? (await cookies()).toString();
  if (!cookieValue) return null;
  const options = {
    headers: { Cookie: cookieValue },
    ...(origin ? { baseURL: `${origin}/api` } : {}),
  };
  try {
    const { data } = await api.get<User | null>("/auth/session", options);
    if (data && typeof data.email === "string") return data;
    const me = await api.get<User | null>("/users/me", options);
    return me.data && typeof me.data.email === "string" ? me.data : null;
  } catch {
    return null;
  }
}
