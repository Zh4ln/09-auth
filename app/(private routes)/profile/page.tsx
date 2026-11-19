import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/api/serverApi";
import Profile from "@/components/Profile/Profile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Profile | NoteHub",
  description: "View your NoteHub account profile.",
};

export default async function ProfilePage() {
  let user;
  try {
    user = await getMe();
  } catch {
    redirect("/sign-in");
  }
  return <Profile user={user} />;
}
