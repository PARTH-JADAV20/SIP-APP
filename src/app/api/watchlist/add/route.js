import { MongoClient } from "mongodb";

const MONGO_URI = "mongodb://localhost:27017/mutual_funds";
const DB_NAME = "mutual_funds";
const COLLECTION_NAME = "watchlist";

let mongoClient;

async function getClient() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
  }
  return mongoClient;
}

export async function POST(req) {
  const { schemeCode } = await req.json();
  const client = await getClient();
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  await collection.updateOne(
    { _id: "dummyUser" },
    { $addToSet: { funds: { schemeCode, addedAt: new Date() } } },
    { upsert: true }
  );

  return new Response(JSON.stringify({ message: "Added to watchlist" }));
}
