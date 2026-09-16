"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/activity", label: "Activity" },
  { href: "/dashboard/reviews", label: "Reviews" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardNav({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
          <span className="inline-block w-7 h-7 rounded bg-brand-600 text-white text-center text-sm leading-7 font-bold">P</span>
          <span>Pay &amp; Review</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="px-3 py-1.5 rounded hover:bg-gray-100">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {userEmail && <span className="text-xs text-gray-500">{userEmail}</span>}
          <form action="/api/auth/logout" method="POST">
            <button className="text-sm text-gray-600 hover:text-gray-900 min-h-[36px] px-3">
              Log out
            </button>
          </form>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="md:hidden p-2 -mr-2 rounded hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu drawer */}
      {open && (
        <nav className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-2 flex flex-col">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 -mx-2 px-2 rounded hover:bg-gray-100 text-sm"
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 my-2" />
            {userEmail && (
              <div className="py-2 text-xs text-gray-500 truncate">{userEmail}</div>
            )}
            <form action="/api/auth/logout" method="POST">
              <button className="w-full text-left py-3 -mx-2 px-2 rounded hover:bg-gray-100 text-sm text-gray-700">
                Log out
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}
