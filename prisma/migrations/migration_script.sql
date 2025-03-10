-- PostgreSQL migration script
-- This script helps with the migration from SQLite to PostgreSQL

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "Job_posterId_idx" ON "Job"("posterId");
CREATE INDEX IF NOT EXISTS "Job_status_idx" ON "Job"("status");
CREATE INDEX IF NOT EXISTS "Message_jobId_idx" ON "Message"("jobId");
CREATE INDEX IF NOT EXISTS "Message_senderId_receiverId_idx" ON "Message"("senderId", "receiverId");
CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");
CREATE INDEX IF NOT EXISTS "Message_isRead_idx" ON "Message"("isRead");

-- Create function for message notifications
CREATE OR REPLACE FUNCTION notify_new_message() RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_message', 
    json_build_object(
      'messageId', NEW.id,
      'jobId', NEW."jobId",
      'senderId', NEW."senderId",
      'receiverId', NEW."receiverId"
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS message_insert_trigger ON "Message";
CREATE TRIGGER message_insert_trigger
AFTER INSERT ON "Message"
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_job_id TEXT,
  p_receiver_id TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE "Message"
  SET "isRead" = TRUE, "updatedAt" = NOW()
  WHERE "jobId" = p_job_id
    AND "receiverId" = p_receiver_id
    AND "isRead" = FALSE;
    
  PERFORM pg_notify(
    'messages_read',
    json_build_object(
      'jobId', p_job_id,
      'receiverId', p_receiver_id
    )::text
  );
END;
$$ LANGUAGE plpgsql; 