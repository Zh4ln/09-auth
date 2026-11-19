"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchNoteById } from "@/lib/api/clientApi";
import NoteDetails from "@/components/NoteDetails/NoteDetails";
import css from "./NoteDetails.module.css";

export default function NoteDetailsClient() {
  const { id } = useParams<{ id: string }>();
  const {
    data: note,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["note", id],
    queryFn: () => fetchNoteById(id),
    enabled: Boolean(id),
    refetchOnMount: false,
  });

  if (isPending) return <p className={css.status}>Loading, please wait ...</p>;
  if (isError || !note)
    return <p className={css.status}>Something went wrong.</p>;

  return (
    <main className={css.main}>
      <div className={css.container}>
        <NoteDetails note={note} />
        <Link className={css.back} href="/notes/filter/all">
          ← Back to notes
        </Link>
      </div>
    </main>
  );
}
