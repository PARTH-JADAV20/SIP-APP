// lib/mongodb.js
import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'mutual_funds';
let client = null;

export async function getMongoClient() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  }
  return client;
}

export async function getDb() {
  const c = await getMongoClient();
  return c.db(DB_NAME);
}
