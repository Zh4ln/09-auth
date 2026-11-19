"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { createNote } from "@/lib/api/clientApi";
import { useNoteStore } from "@/lib/store/noteStore";
import type { NoteTag } from "@/types/note";
import css from "./NoteForm.module.css";

const tags: NoteTag[] = ["Todo", "Work", "Personal", "Meeting", "Shopping"];

export default function NoteForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const draft = useNoteStore((state) => state.draft);
  const setDraft = useNoteStore((state) => state.setDraft);
  const clearDraft = useNoteStore((state) => state.clearDraft);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    // Delay localStorage hydration until after the initial SSR/client render.
    void useNoteStore.persist.rehydrate().then(
      () => {
        if (active) setHydrated(true);
      },
      () => {
        if (active) setHydrated(true);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: async () => {
      clearDraft();
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note created successfully");
      router.push("/notes/filter/all");
    },
    onError: () => toast.error("Failed to create the note. Try again."),
  });

  const submitAction = async (formData: FormData) => {
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const tagValue = String(formData.get("tag") ?? "");
    const tag = tags.find((item) => item === tagValue);

    if (title.length < 3 || title.length > 50) {
      toast.error("Title must contain between 3 and 50 characters.");
      return;
    }
    if (content.length > 500) {
      toast.error("Content must be no more than 500 characters.");
      return;
    }
    if (!tag) {
      toast.error("Please select a valid tag.");
      return;
    }

    try {
      await createMutation.mutateAsync({ title, content, tag });
    } catch {
      // useMutation.onError shows the notification; preserve the draft.
    }
  };

  if (!hydrated) {
    return (
      <p className={css.loading} role="status">
        Restoring draft…
      </p>
    );
  }

  return (
    <form className={css.form}>
      <div className={css.formGroup}>
        <label htmlFor="title">Title</label>
        <input
          className={css.input}
          id="title"
          name="title"
          type="text"
          minLength={3}
          maxLength={50}
          required
          autoFocus
          defaultValue={draft.title}
          onChange={(event) => setDraft({ title: event.currentTarget.value })}
        />
      </div>

      <div className={css.formGroup}>
        <label htmlFor="content">Content</label>
        <textarea
          className={css.textarea}
          id="content"
          name="content"
          rows={8}
          maxLength={500}
          defaultValue={draft.content}
          onChange={(event) => setDraft({ content: event.currentTarget.value })}
        />
      </div>

      <div className={css.formGroup}>
        <label htmlFor="tag">Tag</label>
        <select
          className={css.select}
          id="tag"
          name="tag"
          required
          defaultValue={draft.tag}
          onChange={(event) =>
            setDraft({ tag: event.currentTarget.value as NoteTag })
          }
        >
          {tags.map((tag) => (
            <option value={tag} key={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      <div className={css.actions}>
        <button
          type="button"
          className={css.cancelButton}
          onClick={() => router.back()}
        >
          Cancel
        </button>
        <button
          type="submit"
          formAction={submitAction}
          className={css.submitButton}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Creating…" : "Create note"}
        </button>
      </div>
    </form>
  );
}
