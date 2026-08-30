CREATE TYPE "public"."claim_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."shop_type" AS ENUM('tcg_specialty', 'comic_shop', 'game_store', 'sports_cards', 'hobby_store', 'toy_store', 'collectibles', 'general_retail', 'other');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "games_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(250) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"image_url" text,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"author_id" text NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "shop_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"status" "claim_status" DEFAULT 'pending' NOT NULL,
	"proof_url" text,
	"notes" text,
	"reviewed_at" timestamp,
	"reviewed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"game_id" integer NOT NULL,
	"game_source" varchar(20) DEFAULT 'original',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"days" jsonb NOT NULL,
	"opens" varchar(10),
	"closes" varchar(10),
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar(200),
	"body" text,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"ip" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"meta_description" text,
	"description_source" varchar(30) DEFAULT 'original',
	"street" text,
	"city" varchar(100),
	"state" varchar(50),
	"postal_code" varchar(20),
	"country" varchar(50) DEFAULT 'United States',
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"telephone" text,
	"email" text,
	"website" text,
	"image_url" text,
	"image_source" varchar(20) DEFAULT 'none',
	"rating_value" numeric(3, 1),
	"review_count" integer DEFAULT 0,
	"shop_type" "shop_type" DEFAULT 'other' NOT NULL,
	"should_index" boolean DEFAULT false NOT NULL,
	"claimed_by" text,
	"claimed_at" timestamp,
	"is_sponsored" boolean DEFAULT false NOT NULL,
	"sponsored_expires_at" timestamp,
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shops_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"tagline" varchar(200) NOT NULL,
	"website_url" text NOT NULL,
	"image_url" text,
	"starts_at" date NOT NULL,
	"ends_at" date NOT NULL,
	"total_cents" integer NOT NULL,
	"stripe_session_id" text NOT NULL,
	"user_id" text,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sponsors_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_claims" ADD CONSTRAINT "shop_claims_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_claims" ADD CONSTRAINT "shop_claims_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_claims" ADD CONSTRAINT "shop_claims_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_games" ADD CONSTRAINT "shop_games_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_games" ADD CONSTRAINT "shop_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_hours" ADD CONSTRAINT "shop_hours_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_reviews" ADD CONSTRAINT "shop_reviews_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_reviews" ADD CONSTRAINT "shop_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_claimed_by_user_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "games_slug_idx" ON "games" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shopClaims_shopId_idx" ON "shop_claims" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "shopClaims_status_idx" ON "shop_claims" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "shopGames_shop_game" ON "shop_games" USING btree ("shop_id","game_id");--> statement-breakpoint
CREATE INDEX "shopGames_gameId_idx" ON "shop_games" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "shopHours_shopId_idx" ON "shop_hours" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "shopReviews_shopId_idx" ON "shop_reviews" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "shopReviews_status_idx" ON "shop_reviews" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "shopReviews_user_shop" ON "shop_reviews" USING btree ("user_id","shop_id");--> statement-breakpoint
CREATE INDEX "shops_slug_idx" ON "shops" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "shops_state_idx" ON "shops" USING btree ("state");--> statement-breakpoint
CREATE INDEX "shops_city_idx" ON "shops" USING btree ("city");--> statement-breakpoint
CREATE INDEX "shops_state_city_idx" ON "shops" USING btree ("state","city");--> statement-breakpoint
CREATE INDEX "shops_shopType_idx" ON "shops" USING btree ("shop_type");--> statement-breakpoint
CREATE INDEX "shops_shouldIndex_idx" ON "shops" USING btree ("should_index");--> statement-breakpoint
CREATE INDEX "sponsors_slot_dates_idx" ON "sponsors" USING btree ("slot","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");