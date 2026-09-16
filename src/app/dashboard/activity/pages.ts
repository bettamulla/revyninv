import { requireUser } from "@/lib/session";
import { db } from "@/db";
import { invoices, reminders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  reminder: "Chase reminder",
  thank_you: "Thank-you email",
  thank_you_followup: "Review follow-up",
};

const CHANNEL_ICON: Record<string, string> = {
  email: "✉️", whatsapp: "💬",
};

export default async function ActivityPage() {
  const session = await requireUser();
  const rows = await db
    .select({ r: reminders, inv: invoices })
    .from(reminders)
    .innerJoin(invoices, eq(invoices.id, reminders.invoiceId))
    .where(eq(invoices.userId, session.sub))
    .orderBy(desc(reminders.scheduledAt))
    .limit(100);

  const sent = rows.filter((row) => row.r.status === "sent").length;
  const scheduled = rows.filter((row) => row.r.status === "scheduled").length;
  const cancelled = rows.filter((row) => row.r.status === "cancelled").length;
  const failed = rows.filter((row) => row.r.status === "failed").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Activity</h1>
      <p className="mt-1 text-sm text-gray-600">Every reminder the autopilot has queued, sent, or cancelled.</p>
<!---->
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4"><div className="text-sm text-gray-500">Sent
</div>

<div className="mt-1 text-2xl font-semibold text-green-700">{sent}</div></div>
        <div className="card p-4"><div className="text-sm text-gray-500">Scheduled</div><div className="mt-1 text-2xl font-semibold text-blue-700">{scheduled}</div></div>
        <div className="card p-4"><div className="text-sm text-gray-500">Cancelled</div><div className="mt-1 text-2xl font-semibold text-gray-500">{cancelled}</div></div>
        <div className="card p-4"><div className="text-sm text-gray-500">Failed</div><div className="mt-1 text-2xl font-semibold text-red-700">{failed}</div></div>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Recent activity</h2>
      <div className="mt-3 card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No reminders yet. Create an invoice to start the autopilot.</td></tr>
            )}
            {rows.map(({ r, inv }) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{format(r.scheduledAt, "MMM d, h:mm a")}</td>
                <td className="px-4 py-3">{KIND_LABEL[r.kind] ?? r.kind}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{inv.clientName}</div>
                  <div className="text-xs text-gray-500 font-mono">{inv.invoiceNumber}</div>
                </td>
                <td className="px-4 py-3">{CHANNEL_ICON[r.channel] ?? "·"} {r.channel}</td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: "bg-green-100 text-green-800",
    scheduled: "bg-blue-100 text-blue-800",
    cancelled: "bg-gray-100 text-gray-700",
    failed: "bg-red-100 text-red-800",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}
