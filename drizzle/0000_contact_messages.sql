CREATE TABLE contact_messages (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  source_key TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX contact_messages_source_received ON contact_messages (source_key, received_at);
