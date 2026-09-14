import { requireUser } from "@/lib/session";
import { db } from "@/db";
import { invoices, reviewRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const session = await requireUser();

  const rows = await db
    .select({
      inv: invoices,
      rr: reviewRequests,
    })
    .from(reviewRequests)
    .innerJoin(invoices, eq(invoices.id, reviewRequests.invoiceId))
    .where(eq(invoices.userId, session.sub))
    .orderBy(desc(reviewRequests.createdAt));

  const sent = rows.filter((r) => r.rr.sentAt);
  const collected = sent.filter((r) => r.rr.clickedAt);

  const rate = sent.length > 0 ? Math.round((collected.length / sent.length) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Reviews</h1>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm text-gray-500">Requests sent</div>
          <div className="mt-2 text-3xl font-semibold">{sent.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500">Clicks</div>
          <div className="mt-2 text-3xl font-semibold">{collected.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500">Click rate</div>
          <div className="mt-2 text-3xl font-semibold">{rate}%</div>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Recent review requests</h2>

      {/* Desktop table */}
      <div className="mt-3 hidden md:block card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Sent</th>
              <th className="px-4 py-3">Clicked</th>
              <th className="px-4 py-3">Follow-up</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No review requests yet. They go out automatically when an invoice is paid.
                </td>
              </tr>
            )}
            {rows.map(({ inv, rr }) => {
              const status = !rr.sentAt
                ? "Pending payment"
                : rr.clickedAt
                ? "✓ Clicked"
                : "Awaiting";
              return (
                <tr key={rr.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{inv.clientName}</div>
                    <div className="text-xs text-gray-500">{inv.invoiceNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {rr.sentAt ? format(rr.sentAt, "MMM d, h:mm a") : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {rr.clickedAt ? format(rr.clickedAt, "MMM d, h:mm a") : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {rr.followUpSentAt ? format(rr.followUpSentAt, "MMM d") : "—"}
                  </td>
                  <td className="px-4 py-3">{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-3 md:hidden space-y-3">
        {rows.length === 0 && (
          <div className="card p-8 text-center text-gray-500 text-sm">
            No review requests yet. They go out automatically when an invoice is paid.
          </div>
        )}
        {rows.map(({ inv, rr }) => {
          const status = !rr.sentAt
            ? "Pending payment"
            : rr.clickedAt
            ? "✓ Clicked"
            : "Awaiting";
          return (
            <div key={rr.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{inv.clientName}</div>
                  <div className="text-xs text-gray-500 truncate">{inv.invoiceNumber}</div>
                </div>
                <span className="text-sm text-gray-600 whitespace-nowrap">{status}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">Sent</div>
                  <div>{rr.sentAt ? format(rr.sentAt, "MMM d") : "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Clicked</div>
                  <div>{rr.clickedAt ? format(rr.clickedAt, "MMM d") : "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Follow-up</div>
                  <div>{rr.followUpSentAt ? format(rr.followUpSentAt, "MMM d") : "—"}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
