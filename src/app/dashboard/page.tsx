import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/db";
import { invoices, reviewRequests } from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

function sumByCurrency(rows: { amount: number; currency: string; status: string }[]): { currency: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (r.status !== "paid") continue;
    totals.set(r.currency, (totals.get(r.currency) ?? 0) + r.amount);
  }
  return Array.from(totals.entries()).map(([currency, total]) => ({ currency, total }));
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default async function DashboardOverview() {
  const session = await requireUser();

  const allInvoices = await db.query.invoices.findMany({
    where: eq(invoices.userId, session.sub),
  });

  const total = allInvoices.length;
  const paid = allInvoices.filter((i) => i.status === "paid").length;
  const pending = allInvoices.filter((i) => i.status === "pending").length;
  const now = new Date();
  const overdue = allInvoices.filter((i) => i.status === "pending" && new Date(i.dueDate) < now).length;

  const revenueByCurrency = sumByCurrency(allInvoices);
  const revenueDisplay =
    revenueByCurrency.length === 0
      ? "—"
      : revenueByCurrency.length === 1
      ? formatMoney(revenueByCurrency[0].total, revenueByCurrency[0].currency)
      : revenueByCurrency.map((r) => formatMoney(r.total, r.currency)).join(" + ");

  const sentReviews = await db
    .select()
    .from(reviewRequests)
    .innerJoin(invoices, eq(invoices.id, reviewRequests.invoiceId))
    .where(and(eq(invoices.userId, session.sub), isNotNull(reviewRequests.sentAt)));

  const reviewsSent = sentReviews.length;
  const reviewsCollected = sentReviews.filter((row) => row.review_requests.clickedAt).length;

  const cards = [
    { label: "Invoices", value: total, sub: `${pending} pending · ${overdue} overdue` },
    { label: "Paid", value: paid, sub: total > 0 ? `${Math.round((paid / total) * 100)}% conversion` : "—" },
    { label: "Revenue collected", value: revenueDisplay, sub: "lifetime" },
    {
      label: "Reviews",
      value: `${reviewsCollected}/${reviewsSent}`,
      sub: reviewsSent > 0 ? `${Math.round((reviewsCollected / reviewsSent) * 100)}% click rate` : "none yet",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <Link href="/dashboard/invoices/new" className="btn-primary text-sm">+ New</Link>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="mt-2 text-3xl font-semibold">{c.value}</div>
            <div className="mt-1 text-xs text-gray-500">{c.sub}</div>
          </div>
        ))}
      </div>

      {total === 0 && (
        <div className="mt-10 card p-10 text-center">
          <h2 className="text-lg font-semibold">No invoices yet</h2>
          <p className="mt-2 text-sm text-gray-600">Create your first invoice to start chasing and collecting reviews on autopilot.</p>
          <Link href="/dashboard/invoices/new" className="btn-primary mt-6 inline-flex">Create your first invoice</Link>
        </div>
      )}
    </div>
  );
}
