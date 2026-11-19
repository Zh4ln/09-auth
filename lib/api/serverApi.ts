import type { AxiosResponse } from "axios";
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

// The entire Axios response is required by proxy.ts: session refresh
// cookies are exposed on response.headers["set-cookie"].
export async function checkSession(
  cookieHeader?: string,
  origin?: string,
): Promise<AxiosResponse<User>> {
  const cookieValue = cookieHeader ?? (await cookies()).toString();
  return api.get<User>("/auth/session", {
    headers: { Cookie: cookieValue },
    ...(origin ? { baseURL: `${origin}/api` } : {}),
  });
}
