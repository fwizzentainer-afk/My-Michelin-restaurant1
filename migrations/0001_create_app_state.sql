CREATE TABLE IF NOT EXISTS "app_state" (
  "key" text PRIMARY KEY,
  "tables" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "menus" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "historical_logs" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
