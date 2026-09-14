import { db } from "@/db";
import { invoices, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { MarkPaidButton } from "./mark-paid-button";
import { format, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export default async function PublicPayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await db.query.invoices.findFirst({ where: eq(invoices.paidToken, token) });
  if (!inv) notFound();
  const user = await db.query.users.findFirst({ where: eq(users.id, inv.userId) });
  if (!user) notFound();

  const isPaid = inv.status === "paid";
  const due = parseISO(inv.dueDate);
  const overdue = !isPaid && due < new Date();

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md card p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-8 rounded bg-brand-600 text-white text-center text-sm leading-8 font-bold">P</span>
          <div className="text-sm text-gray-500">{user.businessName}</div>
        </div>
        <h1 className="mt-4 text-2xl font-semibold">Invoice {inv.invoiceNumber}</h1>

        <div className="mt-6 space-y-3 text-sm">
          <Row label="Billed to" value={inv.clientName} />
          <Row label="Issued" value={format(parseISO(inv.issuedDate), "MMM d, yyyy")} />
          <Row
            label="Due"
            value={
              <>
                {format(due, "MMM d, yyyy")}
                {overdue && (
                  <span className="ml-2 text-red-600 text-xs font-semibold">(overdue)</span>
                )}
              </>
            }
          />
          <div className="border-t border-gray-200 pt-3 mt-3 flex items-baseline justify-between">
            <span className="font-semibold">Amount due</span>
            <span className="font-semibold text-xl sm:text-2xl">
              ${inv.amount.toFixed(2)} <span className="text-sm font-normal text-gray-500">{inv.currency}</span>
            </span>
          </div>
        </div>

        {inv.description && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
            {inv.description}
          </div>
        )}

        <div className="mt-8">
          {isPaid ? (
            <div className="rounded-md bg-green-50 border border-green-200 p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-800 font-semibold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Paid
              </div>
              <div className="text-xs text-green-700 mt-1">
                Thank you! A receipt and review request has been emailed to {inv.clientEmail}.
              </div>
            </div>
          ) : (
            <MarkPaidButton token={token} />
          )}
        </div>

        <p className="mt-6 text-xs text-gray-400 text-center">
          Powered by Pay &amp; Review
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className="text-gray-500 whitespace-nowrap">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
