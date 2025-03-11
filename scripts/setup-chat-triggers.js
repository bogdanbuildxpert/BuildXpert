const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function setupChatTriggers() {
  try {
    console.log(
      "Setting up PostgreSQL triggers for real-time chat notifications..."
    );

    // Create function for new message notifications
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION notify_new_message()
      RETURNS TRIGGER AS $$
      DECLARE
        payload JSONB;
      BEGIN
        payload := jsonb_build_object(
          'id', NEW.id,
          'content', NEW.content,
          'senderId', NEW."senderId",
          'receiverId', NEW."receiverId",
          'jobId', NEW."jobId",
          'isRead', NEW."isRead",
          'createdAt', NEW."createdAt",
          'updatedAt', NEW."updatedAt"
        );
        PERFORM pg_notify('new_message', payload::text);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log("✅ Created notify_new_message function");

    // Create function for message read status notifications
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION notify_message_read()
      RETURNS TRIGGER AS $$
      DECLARE
        payload JSONB;
      BEGIN
        IF OLD."isRead" = false AND NEW."isRead" = true THEN
          payload := jsonb_build_object(
            'id', NEW.id,
            'senderId', NEW."senderId",
            'receiverId', NEW."receiverId",
            'jobId', NEW."jobId"
          );
          PERFORM pg_notify('messages_read', payload::text);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log("✅ Created notify_message_read function");

    // Drop existing triggers if they exist - one by one
    await prisma.$executeRawUnsafe(
      `DROP TRIGGER IF EXISTS message_insert_trigger ON "Message";`
    );
    console.log("✅ Dropped message_insert_trigger if it existed");

    await prisma.$executeRawUnsafe(
      `DROP TRIGGER IF EXISTS message_update_trigger ON "Message";`
    );
    console.log("✅ Dropped message_update_trigger if it existed");

    // Create trigger for new messages
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER message_insert_trigger
      AFTER INSERT ON "Message"
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_message();
    `);

    console.log("✅ Created message_insert_trigger");

    // Create trigger for message read status updates
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER message_update_trigger
      AFTER UPDATE ON "Message"
      FOR EACH ROW
      EXECUTE FUNCTION notify_message_read();
    `);

    console.log("✅ Created message_update_trigger");

    console.log(
      "✅ All PostgreSQL triggers for chat notifications have been set up successfully!"
    );
  } catch (error) {
    console.error("❌ Error setting up PostgreSQL triggers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
setupChatTriggers();
