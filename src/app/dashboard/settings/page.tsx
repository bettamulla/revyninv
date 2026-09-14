import { requireUser } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireUser();
  const user = await db.query.users.findFirst({ where: eq(users.id, session.sub) });
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-gray-600">
        Tweak your business profile, review links, and message templates.
      </p>
      <div className="mt-6">
        <SettingsForm
          initial={{
            businessName: user.businessName,
            contactPhone: user.contactPhone || "",
            reviewLinkGoogle: user.reviewLinkGoogle || "",
            reviewLinkTrustpilot: user.reviewLinkTrustpilot || "",
            reviewLinkCustom: user.reviewLinkCustom || "",
            reminderOffsets: user.reminderOffsets,
            emailTemplate: user.emailTemplate || "",
            whatsappTemplate: user.whatsappTemplate || "",
            thankYouTemplate: user.thankYouTemplate || "",
          }}
        />
      </div>
    </div>
  );
}
