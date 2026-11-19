import type { Note } from "@/types/note";
import css from "./NoteDetails.module.css";

interface NoteDetailsProps {
  note: Note;
}

export default function NoteDetails({ note }: NoteDetailsProps) {
  return (
    <article className={css.item}>
      <div className={css.header}>
        <h2>{note.title}</h2>
      </div>
      <p className={css.tag}>{note.tag}</p>
      <p className={css.content}>{note.content}</p>
      <p className={css.date}>
        Created:{" "}
        <time dateTime={note.createdAt}>{note.createdAt.slice(0, 10)}</time>
      </p>
    </article>
  );
}
