CREATE TABLE IF NOT EXISTS "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text NOT NULL,
	"client_phone" text,
	"amount" double precision NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"description" text,
	"due_date" text NOT NULL,
	"issued_date" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"paid_token" text NOT NULL,
	"review_platform" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"kind" text NOT NULL,
	"channel" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"offset_days" integer,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"sent_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"follow_up_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_requests_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"business_name" text DEFAULT 'My Business' NOT NULL,
	"contact_phone" text,
	"logo_url" text,
	"review_link_google" text,
	"review_link_trustpilot" text,
	"review_link_custom" text,
	"email_template" text,
	"whatsapp_template" text,
	"thank_you_template" text,
	"reminder_offsets" text DEFAULT '-3,0,3,7,14' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reminders" ADD CONSTRAINT "reminders_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_paid_token_idx" ON "invoices" USING btree ("paid_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_user_idx" ON "invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminders_scheduled_idx" ON "reminders" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminders_invoice_idx" ON "reminders" USING btree ("invoice_id");