CREATE TABLE "feedback_submissions" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile_id" UUID,
    "trip_id" UUID,
    "user_email" TEXT,
    "user_display_name" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "source_route" TEXT NOT NULL,
    "app_version" TEXT NOT NULL,
    "browser_info" JSONB,
    "screenshot_bucket" TEXT,
    "screenshot_path" TEXT,
    "screenshot_filename" TEXT,
    "screenshot_content_type" TEXT,
    "screenshot_size_bytes" INTEGER,
    "latest_staff_note" TEXT,
    "latest_staff_update_at" TIMESTAMP(3),
    "linear_issue_id" TEXT,
    "linear_issue_identifier" TEXT,
    "linear_issue_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feedback_status_updates" (
    "id" UUID NOT NULL,
    "feedback_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "staff_note" TEXT,
    "email_delivery_status" TEXT,
    "emailed_at" TIMESTAMP(3),
    "email_error" TEXT,
    "created_by_profile_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_status_updates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "feedback_submissions_user_id_created_at_idx" ON "feedback_submissions"("user_id", "created_at");
CREATE INDEX "feedback_submissions_profile_id_idx" ON "feedback_submissions"("profile_id");
CREATE INDEX "feedback_submissions_trip_id_idx" ON "feedback_submissions"("trip_id");
CREATE INDEX "feedback_submissions_status_idx" ON "feedback_submissions"("status");
CREATE INDEX "feedback_status_updates_feedback_id_created_at_idx" ON "feedback_status_updates"("feedback_id", "created_at");
CREATE INDEX "feedback_status_updates_created_by_profile_id_idx" ON "feedback_status_updates"("created_by_profile_id");

ALTER TABLE "feedback_submissions"
ADD CONSTRAINT "feedback_submissions_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "feedback_submissions"
ADD CONSTRAINT "feedback_submissions_trip_id_fkey"
FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "feedback_status_updates"
ADD CONSTRAINT "feedback_status_updates_feedback_id_fkey"
FOREIGN KEY ("feedback_id") REFERENCES "feedback_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "feedback_status_updates"
ADD CONSTRAINT "feedback_status_updates_created_by_profile_id_fkey"
FOREIGN KEY ("created_by_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
