-- PostgreSQL triggers for notifications

-- Function for sending new message notifications
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify about new message with JSON payload
  PERFORM pg_notify(
    'new_message',
    json_build_object(
      'id', NEW.id,
      'senderId', NEW.senderId,
      'receiverId', NEW.receiverId,
      'jobId', NEW.jobId,
      'content', NEW.content,
      'isRead', NEW.isRead,
      'createdAt', NEW.createdAt
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for sending message read notifications
CREATE OR REPLACE FUNCTION notify_message_read()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when message is marked as read (false -> true)
  IF OLD.isRead = FALSE AND NEW.isRead = TRUE THEN
    -- Notify about message being read
    PERFORM pg_notify(
      'messages_read',
      json_build_object(
        'id', NEW.id,
        'senderId', NEW.senderId,
        'receiverId', NEW.receiverId,
        'jobId', NEW.jobId,
        'readBy', NEW.receiverId,
        'readAt', now()
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS message_insert_trigger ON "Message";
DROP TRIGGER IF EXISTS message_update_trigger ON "Message";

-- Create trigger for new messages
CREATE TRIGGER message_insert_trigger
AFTER INSERT ON "Message"
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- Create trigger for message read status updates
CREATE TRIGGER message_update_trigger
AFTER UPDATE ON "Message"
FOR EACH ROW
EXECUTE FUNCTION notify_message_read(); 