CREATE TABLE IF NOT EXISTS "public"."cities" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "slug" text NOT NULL,
  "city" text NOT NULL,
  "country" text NOT NULL,
  "country_code" text NOT NULL,
  "lat" double precision NOT NULL,
  "lng" double precision NOT NULL,
  "region" text,
  "iata_code" text,
  "popular" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cities_slug_key" ON "public"."cities" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "cities_city_country_code_key" ON "public"."cities" ("city", "country_code");
CREATE INDEX IF NOT EXISTS "cities_country_code_idx" ON "public"."cities" ("country_code");
CREATE INDEX IF NOT EXISTS "cities_popular_idx" ON "public"."cities" ("popular");
