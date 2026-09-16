import { requireUser } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "./settings-form";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireUser();
  const user = await db.query.users.findFirst({ where: eq(users.id, session.sub) });
  if (!user) return null;

  const status = {
    email: Boolean(config.email.resendApiKey),
    whatsapp: config.twilio.enabled(),
    reviewGoogle: Boolean(user.reviewLinkGoogle),
    reviewTrustpilot: Boolean(user.reviewLinkTrustpilot),
  };
  const configuredCount = Object.values(status).filter(Boolean).length;
  const totalCount = Object.keys(status).length;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-gray-600">Configure your business profile, review links, and message templates.</p>
<!---->
      <div className="mt-6 card p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Autopilot status</h2>
          <span className="text-xs text-gray-500">{configuredCount} of {totalCount} configured</span>
        
</div>


        <p className="mt-1 text-sm text-gray-600">Configure these in Vercel → Settings → Environment Variables for live sending.</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <StatusRow label="Email (Resend)" ok={status.email} hint="Set RESEND_API_KEY in Vercel" />
          <StatusRow label="WhatsApp (Twilio)" ok={status.whatsapp} hint="Set TWILIO_* in Vercel" />
          <StatusRow label="Google review link" ok={status.reviewGoogle} hint="Set below in review links" />
          <StatusRow label="Trustpilot review link" ok={status.reviewTrustpilot} hint="Set below in review links" />
        </div>
      </div>

      <div className="mt-6">
        <SettingsForm initial={{
          businessName: user.businessName,
          contactPhone: user.contactPhone || "",
          reviewLinkGoogle: user.reviewLinkGoogle || "",
          reviewLinkTrustpilot: user.reviewLinkTrustpilot || "",
          reviewLinkCustom: user.reviewLinkCustom || "",
          reminderOffsets: user.reminderOffsets,
          emailTemplate: user.emailTemplate || "",
          whatsappTemplate: user.whatsappTemplate || "",
          thankYouTemplate: user.thankYouTemplate || "",
        }} />
      </div>
    </div>
  );
}

function StatusRow({ label, ok, hint }: { label: string; ok: boolean; hint: string }) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-3">
        <span className={ok ? "inline-block w-2.5 h-2.5 rounded-full bg-green-500" : "inline-block w-2.5 h-2.5 rounded-full bg-gray-300"} />
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-gray-500">{hint}</div>
        </div>
      </div>
      <span className={ok ? "text-xs font-semibold text-green-700" : "text-xs font-semibold text-gray-400"}>
        {ok ? "Connected" : "Not set"}
      </span>
    </div>
  );
}
