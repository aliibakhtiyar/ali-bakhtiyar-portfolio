import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';

export async function openInbox(uri, databaseName) {
  const client = new MongoClient(uri, {
    serverApi: ServerApiVersion.v1,
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 8,
  });

  try {
    await client.connect();
    const database = client.db(databaseName);
    const messages = database.collection('contact_messages');
    const sessions = database.collection('admin_sessions');
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await messages.createIndex({ isRead: 1, _id: -1 });

    return {
      async saveMessage(message) {
        await messages.insertOne({ ...message, isRead: false, receivedAt: new Date() });
      },
      async listMessages({ cursor, unread, limit }) {
        const filter = {};
        if (unread) filter.isRead = false;
        if (cursor) filter._id = { $lt: new ObjectId(cursor) };
        const documents = await messages.find(filter).sort({ _id: -1 }).limit(limit + 1).toArray();
        const items = documents.slice(0, limit).map(({ _id, name, email, subject, message, receivedAt, isRead }) => ({
          id: _id.toHexString(), name, email, subject, message, receivedAt, isRead,
        }));
        return { items, nextCursor: documents.length > limit ? items.at(-1).id : null };
      },
      async setRead(id, isRead) {
        const result = await messages.updateOne({ _id: new ObjectId(id) }, { $set: { isRead } });
        return result.matchedCount !== 0;
      },
      async createSession(id, expiresAt) {
        await sessions.insertOne({ _id: id, expiresAt });
      },
      async hasSession(id) {
        return Boolean(await sessions.findOne({ _id: id, expiresAt: { $gt: new Date() } }, { projection: { _id: 1 } }));
      },
      async deleteSession(id) {
        await sessions.deleteOne({ _id: id });
      },
      close: () => client.close(),
    };
  } catch (error) {
    await client.close().catch(() => {});
    throw error;
  }
}
