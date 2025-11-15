-- Add per-user Deepgram settings
ALTER TABLE "User" ADD COLUMN "deepgramOptions" JSONB;


