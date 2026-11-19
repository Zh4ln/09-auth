import type { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { fetchNoteById } from "@/lib/api/serverApi";
import NoteDetailsClient from "./NoteDetails.client";

export const dynamic = "force-dynamic";

interface NoteDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: NoteDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const note = await fetchNoteById(id);
    const title = `${note.title} | NoteHub`;
    const description = note.content
      ? note.content.slice(0, 160)
      : `Read the note ${note.title} in NoteHub.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://notehub.com/notes/${encodeURIComponent(id)}`,
        images: [
          {
            url: "https://ac.goit.global/fullstack/react/notehub-og-meta.jpg",
            width: 1200,
            height: 630,
            alt: `${note.title} - NoteHub`,
          },
        ],
      },
    };
  } catch {
    return {
      title: "Note not found | NoteHub",
      description: "The requested note is unavailable.",
      openGraph: {
        title: "Note not found | NoteHub",
        description: "The requested note is unavailable.",
        url: `https://notehub.com/notes/${encodeURIComponent(id)}`,
        images: [
          {
            url: "https://ac.goit.global/fullstack/react/notehub-og-meta.jpg",
            width: 1200,
            height: 630,
            alt: "NoteHub - note not found",
          },
        ],
      },
    };
  }
}

export default async function NoteDetailsPage({
  params,
}: NoteDetailsPageProps) {
  const { id } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["note", id],
    queryFn: () => fetchNoteById(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NoteDetailsClient />
    </HydrationBoundary>
  );
}
