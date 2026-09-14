"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_EMAIL_TEMPLATE,
  DEFAULT_WHATSAPP_TEMPLATE,
  DEFAULT_THANK_YOU_TEMPLATE,
} from "@/lib/templates";

type Form = {
  businessName: string;
  contactPhone: string;
  reviewLinkGoogle: string;
  reviewLinkTrustpilot: string;
  reviewLinkCustom: string;
  reminderOffsets: string;
  emailTemplate: string;
  whatsappTemplate: string;
  thankYouTemplate: string;
};

export function SettingsForm({ initial }: { initial: Form }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Save failed");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="card p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Business</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Business name</label>
            <input
              className="input"
              value={form.businessName}
              onChange={(e) => setField("businessName", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Contact phone</label>
            <input
              className="input"
              type="tel"
              placeholder="+15551234567"
              value={form.contactPhone}
              onChange={(e) => setField("contactPhone", e.target.value)}
              autoComplete="tel"
              inputMode="tel"
            />
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Review links</h2>
        <p className="mt-1 text-sm text-gray-600">
          Paste the full URL clients should land on. For Google, use your GBP &ldquo;write a review&rdquo; URL.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="label">Google</label>
            <input
              className="input"
              type="url"
              value={form.reviewLinkGoogle}
              onChange={(e) => setField("reviewLinkGoogle", e.target.value)}
              placeholder="https://search.google.com/local/writereview?placeid=…"
              inputMode="url"
            />
          </div>
          <div>
            <label className="label">Trustpilot</label>
            <input
              className="input"
              type="url"
              value={form.reviewLinkTrustpilot}
              onChange={(e) => setField("reviewLinkTrustpilot", e.target.value)}
              placeholder="https://www.trustpilot.com/evaluate/yourdomain.com"
              inputMode="url"
            />
          </div>
          <div>
            <label className="label">Custom</label>
            <input
              className="input"
              type="url"
              value={form.reviewLinkCustom}
              onChange={(e) => setField("reviewLinkCustom", e.target.value)}
              inputMode="url"
            />
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Reminder cadence</h2>
        <p className="mt-1 text-sm text-gray-600">
          Day offsets from the due date. Negative = before, 0 = on the day, positive = after.
        </p>
        <input
          className="input mt-3"
          value={form.reminderOffsets}
          onChange={(e) => setField("reminderOffsets", e.target.value)}
        />
        <p className="mt-2 text-xs text-gray-500">Default: -3, 0, 3, 7, 14</p>
      </section>

      <section className="card p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Message templates</h2>
        <details className="mt-2 text-sm text-gray-600">
          <summary className="cursor-pointer hover:text-gray-900">Available placeholders</summary>
          <div className="mt-2 flex flex-wrap gap-1">
            {["clientName", "amount", "dueDate", "invoiceNumber", "businessName", "payLink", "reviewLink"].map(
              (t) => (
                <code key={t} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  {`{{${t}}}`}
                </code>
              ),
            )}
          </div>
        </details>

        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Email chase</label>
            <textarea
              className="input font-mono text-sm"
              rows={5}
              value={form.emailTemplate}
              onChange={(e) => setField("emailTemplate", e.target.value)}
              placeholder={DEFAULT_EMAIL_TEMPLATE}
            />
          </div>
          <div>
            <label className="label">WhatsApp chase</label>
            <textarea
              className="input font-mono text-sm"
              rows={3}
              value={form.whatsappTemplate}
              onChange={(e) => setField("whatsappTemplate", e.target.value)}
              placeholder={DEFAULT_WHATSAPP_TEMPLATE}
            />
          </div>
          <div>
            <label className="label">Thank-you + review request</label>
            <textarea
              className="input font-mono text-sm"
              rows={6}
              value={form.thankYouTemplate}
              onChange={(e) => setField("thankYouTemplate", e.target.value)}
              placeholder={DEFAULT_THANK_YOU_TEMPLATE}
            />
          </div>
        </div>
      </section>

      <div className="sticky-mobile-cta sm:static flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-green-700">Saved ✓</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
        <button className="btn-primary w-full sm:w-auto" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
