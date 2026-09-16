"use client";

import { useState } from "react";

export function MarkPaidButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pay/${token}`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Failed to mark as paid");
        return;
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={pay} disabled={loading || paid} className="btn-primary w-full">
        {loading ? "Marking…" : paid ? "✓ Paid" : "Mark as paid"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
      <p className="mt-3 text-xs text-gray-500 text-center">
        Click this once you&rsquo;ve paid. We&rsquo;ll send the business a confirmation and you&rsquo;ll get a review request.
      </p>
    </div>
  );
}
