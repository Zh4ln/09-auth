"use client";

export default function NoteDetailsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main style={{ maxWidth: 980, margin: "24px auto", padding: "20px" }}>
      <p role="alert">Could not fetch note details. {error.message}</p>
      <button onClick={reset} type="button">
        Try again
      </button>
    </main>
  );
}
