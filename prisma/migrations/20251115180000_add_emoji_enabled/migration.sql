-- Add emojiEnabled preference to users
ALTER TABLE "User" ADD COLUMN "emojiEnabled" BOOLEAN NOT NULL DEFAULT FALSE;


