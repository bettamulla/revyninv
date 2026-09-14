import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { format, isAfter, parseISO } from "date-fns";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

function StatusBadge({ status, dueDate }: { status: string; dueDate: string }) {
  if (status === "paid") return <span className="badge-paid">Paid</span>;
  if (status === "cancelled") return <span className="badge-cancelled">Cancelled</span>;
  const due = parseISO(dueDate);
  if (isAfter(new Date(), due)) return <span className="badge-overdue">Overdue</span>;
  return <span className="badge-pending">Pending</span>;
}

export default async function InvoicesList() {
  const session = await requireUser();
  const list = await db.query.invoices.findMany({
    where: eq(invoices.userId, session.sub),
    orderBy: [desc(invoices.createdAt)],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link href="/dashboard/invoices/new" className="btn-primary text-sm">
          + New
        </Link>
      </div>

      {/* Desktop table */}
      <div className="mt-6 hidden md:block card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No invoices yet. <Link href="/dashboard/invoices/new" className="text-brand-600 hover:underline">Create one</Link>.
                </td>
              </tr>
            )}
            {list.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{inv.clientName}</div>
                  <div className="text-xs text-gray-500">{inv.clientEmail}</div>
                </td>
                <td className="px-4 py-3">
                  ${inv.amount.toFixed(2)} {inv.currency}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {format(parseISO(inv.dueDate), "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={inv.status} dueDate={inv.dueDate} />
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`${config.appUrl}/pay/${inv.paidToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Pay link ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="mt-4 md:hidden space-y-3">
        {list.length === 0 && (
          <div className="card p-8 text-center text-gray-500 text-sm">
            No invoices yet.{" "}
            <Link href="/dashboard/invoices/new" className="text-brand-600 hover:underline">
              Create one
            </Link>
            .
          </div>
        )}
        {list.map((inv) => (
          <Link
            key={inv.id}
            href={`${config.appUrl}/pay/${inv.paidToken}`}
            target="_blank"
            rel="noreferrer"
            className="card p-4 block active:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{inv.clientName}</div>
                <div className="text-xs text-gray-500 truncate">{inv.clientEmail}</div>
              </div>
              <StatusBadge status={inv.status} dueDate={inv.dueDate} />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-lg font-semibold">
                ${inv.amount.toFixed(2)} <span className="text-xs font-normal text-gray-500">{inv.currency}</span>
              </span>
              <span className="text-xs text-gray-500">
                Due {format(parseISO(inv.dueDate), "MMM d")}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-400 font-mono">{inv.invoiceNumber}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
