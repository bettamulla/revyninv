import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DashboardNav } from "./dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.query.users.findFirst({ where: eq(users.id, session.sub) });

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <DashboardNav userEmail={user?.email} />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
