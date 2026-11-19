import type { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { fetchNotes } from "@/lib/api/serverApi";
import type { NoteTag } from "@/types/note";
import NotesClient from "./Notes.client";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;
const validTags: NoteTag[] = [
  "Todo",
  "Work",
  "Personal",
  "Meeting",
  "Shopping",
];
type FilterTag = NoteTag | "all";

interface FilterNotesPageProps {
  params: Promise<{ slug: string[] }>;
}

function isFilterTag(tag: string): tag is FilterTag {
  return tag === "all" || validTags.includes(tag as NoteTag);
}

export async function generateMetadata({
  params,
}: FilterNotesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const selected = slug[0] ?? "all";
  const label = selected === "all" ? "All notes" : `${selected} notes`;
  const title = `${label} | NoteHub`;
  const description = `Browse and manage ${label.toLowerCase()} in NoteHub.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://notehub.com/notes/filter/${encodeURIComponent(selected)}`,
      images: [
        {
          url: "https://ac.goit.global/fullstack/react/notehub-og-meta.jpg",
          width: 1200,
          height: 630,
          alt: `${label} - NoteHub`,
        },
      ],
    },
  };
}

export default async function FilterNotesPage({
  params,
}: FilterNotesPageProps) {
  const { slug } = await params;
  const selected = slug[0];

  if (slug.length !== 1 || !selected || !isFilterTag(selected)) {
    notFound();
  }

  const tag = selected;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["notes", tag, 1, PER_PAGE, ""],
    queryFn: () =>
      fetchNotes({
        page: 1,
        perPage: PER_PAGE,
        search: "",
        tag: tag === "all" ? undefined : tag,
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotesClient key={tag} tag={tag} />
    </HydrationBoundary>
  );
}
