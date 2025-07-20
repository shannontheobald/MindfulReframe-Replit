CREATE TABLE "intake_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"question1" text NOT NULL,
	"question2" text NOT NULL,
	"question3" text NOT NULL,
	"question4" text NOT NULL,
	"question5" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "intake_responses" ADD CONSTRAINT "intake_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;