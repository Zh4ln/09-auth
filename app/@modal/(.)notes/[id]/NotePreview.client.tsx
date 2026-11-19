"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchNoteById } from "@/lib/api/clientApi";
import Modal from "@/components/Modal/Modal";
import NoteDetails from "@/components/NoteDetails/NoteDetails";
import css from "./NotePreview.module.css";

export default function NotePreviewClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const close = useCallback(() => router.back(), [router]);

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

  return (
    <Modal onClose={close} ariaLabel="Note details">
      <div className={css.header}>
        <h2 className={css.heading}>Note details</h2>
        <button
          type="button"
          className={css.closeButton}
          onClick={close}
          aria-label="Close note details"
        >
          ×
        </button>
      </div>
      {isPending && <p className={css.status}>Loading, please wait ...</p>}
      {isError && (
        <p className={css.status} role="alert">
          Something went wrong.
        </p>
      )}
      {!isPending && !isError && note && <NoteDetails note={note} />}
    </Modal>
  );
}
