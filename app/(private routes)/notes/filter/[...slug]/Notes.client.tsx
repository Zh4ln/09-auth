"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import type { NoteTag } from "@/types/note";
import { fetchNotes } from "@/lib/api/clientApi";
import SearchBox from "@/components/SearchBox/SearchBox";
import Pagination from "@/components/Pagination/Pagination";
import NoteList from "@/components/NoteList/NoteList";
import css from "./Notes.module.css";

const PER_PAGE = 12;

interface NotesClientProps {
  tag: NoteTag | "all";
}

export default function NotesClient({ tag }: NotesClientProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value.trim());
    setPage(1);
  }, 400);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
    debouncedSearch(value);
  };

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ["notes", tag, page, PER_PAGE, searchQuery],
    queryFn: () =>
      fetchNotes({
        page,
        perPage: PER_PAGE,
        search: searchQuery,
        tag: tag === "all" ? undefined : tag,
      }),
    placeholderData: keepPreviousData,
  });

  const notes = Array.isArray(data?.notes) ? data.notes : [];

  return (
    <main className={css.main}>
      <div className={css.toolbar}>
        <SearchBox value={searchInput} onChange={handleSearchChange} />
        {data && data.totalPages > 1 && (
          <Pagination
            pageCount={data.totalPages}
            currentPage={page}
            onPageChange={setPage}
          />
        )}
        <Link className={css.button} href="/notes/action/create">
          Create note +
        </Link>
      </div>

      {isPending && <p className={css.status}>Loading notes, please wait…</p>}
      {isFetching && !isPending && (
        <p className={css.updating}>Updating notes…</p>
      )}
      {isError && (
        <p className={css.error} role="alert">
          {error instanceof Error ? error.message : "Failed to load notes."}
        </p>
      )}
      {!isPending && !isError && notes.length > 0 && <NoteList notes={notes} />}
      {!isPending && !isError && data && notes.length === 0 && (
        <p className={css.empty}>No notes found.</p>
      )}
    </main>
  );
}
