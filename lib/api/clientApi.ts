import { api } from "./api";
import type { Note, NoteTag } from "@/types/note";
import type { User } from "@/types/user";

export interface FetchNotesParams {
  page: number;
  perPage: number;
  search?: string;
  tag?: NoteTag;
}

export interface FetchNotesResponse {
  notes: Note[];
  totalPages: number;
}

export interface CreateNoteParams {
  title: string;
  content: string;
  tag: NoteTag;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export type RegisterCredentials = AuthCredentials;

// Server can return a plain array or an object with paging metadata.
export function normalizeNotesResponse(
  data:
    | Note[]
    | { notes?: Note[]; data?: Note[]; totalPages?: number; total?: number },
  page: number,
  perPage: number,
): FetchNotesResponse {
  const notes = Array.isArray(data)
    ? data
    : Array.isArray(data.notes)
      ? data.notes
      : Array.isArray(data.data)
        ? data.data
        : [];
  const totalPages = Array.isArray(data)
    ? page + (notes.length >= perPage ? 1 : 0)
    : typeof data.totalPages === "number"
      ? data.totalPages
      : typeof data.total === "number"
        ? Math.ceil(data.total / perPage)
        : page + (notes.length >= perPage ? 1 : 0);
  return { notes, totalPages: Math.max(1, totalPages) };
}

export async function fetchNotes({
  page,
  perPage,
  search = "",
  tag,
}: FetchNotesParams): Promise<FetchNotesResponse> {
  const response = await api.get<Note[] | FetchNotesResponse>("/notes", {
    params: {
      page,
      perPage,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(tag ? { tag } : {}),
    },
  });
  return normalizeNotesResponse(response.data, page, perPage);
}

export async function fetchNoteById(id: Note["id"]): Promise<Note> {
  const { data } = await api.get<Note>(`/notes/${encodeURIComponent(id)}`);
  return data;
}

export async function createNote(note: CreateNoteParams): Promise<Note> {
  const { data } = await api.post<Note>("/notes", note);
  return data;
}

export async function deleteNote(id: Note["id"]): Promise<Note> {
  const { data } = await api.delete<Note>(`/notes/${encodeURIComponent(id)}`);
  return data;
}

export async function register(
  credentials: RegisterCredentials,
): Promise<User> {
  const { data } = await api.post<User>("/auth/register", credentials);
  return data;
}

export async function login(credentials: AuthCredentials): Promise<User> {
  const { data } = await api.post<User>("/auth/login", credentials);
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function checkSession(): Promise<User | null> {
  try {
    const { data } = await api.get<User | null>("/auth/session");
    return data && typeof data.email === "string" ? data : await getMe();
  } catch {
    return null;
  }
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}

export async function updateMe(payload: Pick<User, "username">): Promise<User> {
  const { data } = await api.patch<User>("/users/me", payload);
  return data;
}
