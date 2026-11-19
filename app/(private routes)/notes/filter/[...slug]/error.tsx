"use client";

export default function NotesError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main style={{ padding: 24 }}>
      <p role="alert">Could not fetch notes. {error.message}</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
