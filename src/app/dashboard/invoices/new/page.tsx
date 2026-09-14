"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewInvoicePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    amount: "",
    currency: "USD",
    description: "",
    dueDate: new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10),
    reviewPlatform: "google",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof typeof form>(key: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Failed to create invoice");
        return;
      }
      router.push("/dashboard/invoices");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/invoices" className="text-sm text-gray-600 hover:underline">
        ← Back to invoices
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">New invoice</h1>
      <p className="mt-1 text-sm text-gray-600">
        We&rsquo;ll schedule reminders automatically based on your settings.
      </p>

      <form onSubmit={submit} className="mt-6 card p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Invoice number</label>
            <input
              className="input"
              value={form.invoiceNumber}
              onChange={(e) => setField("invoiceNumber", e.target.value)}
              required
              autoComplete="off"
              inputMode="text"
            />
          </div>
          <div>
            <label className="label">Due date</label>
            <input
              className="input"
              type="date"
              value={form.dueDate}
              onChange={(e) => setField("dueDate", e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Client name</label>
          <input
            className="input"
            value={form.clientName}
            onChange={(e) => setField("clientName", e.target.value)}
            required
            autoComplete="name"
            enterKeyHint="next"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Client email</label>
            <input
              className="input"
              type="email"
              value={form.clientEmail}
              onChange={(e) => setField("clientEmail", e.target.value)}
              required
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
            />
          </div>
          <div>
            <label className="label">Client phone (WhatsApp)</label>
            <input
              className="input"
              type="tel"
              placeholder="+15551234567"
              value={form.clientPhone}
              onChange={(e) => setField("clientPhone", e.target.value)}
              autoComplete="tel"
              inputMode="tel"
              enterKeyHint="next"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Amount</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setField("amount", e.target.value)}
              required
              inputMode="decimal"
              enterKeyHint="next"
            />
          </div>
          <div>
            <label className="label">Currency</label>
            <select
              className="input"
              value={form.currency}
              onChange={(e) => setField("currency", e.target.value)}
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>CAD</option>
              <option>AUD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description (optional)</label>
          <textarea
            className="input"
            rows={2}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            enterKeyHint="done"
          />
        </div>

        <div>
          <label className="label">Ask for review on (after payment)</label>
          <select
            className="input"
            value={form.reviewPlatform}
            onChange={(e) => setField("reviewPlatform", e.target.value)}
          >
            <option value="google">Google</option>
            <option value="trustpilot">Trustpilot</option>
            <option value="custom">Custom link</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">Configure the actual link in Settings.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Sticky CTA on mobile so it's always reachable */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 sticky-mobile-cta sm:static">
          <Link href="/dashboard/invoices" className="btn-secondary w-full sm:w-auto">
            Cancel
          </Link>
          <button className="btn-primary w-full sm:w-auto" disabled={loading}>
            {loading ? "Creating…" : "Create invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
