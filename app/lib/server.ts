import { Client, Databases, Models } from 'node-appwrite';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BACKEND_ENDPOINT: string;
      BACKEND_PROJECT_ID: string;
      BACKEND_API_KEY: string;
      BACKEND_LINKS_DB_ID: string;
      BACKEND_PUBLIC_LINKS_COLLECTION_ID: string;
    }
  }
}

let client: Client;

if (process.env.NODE_ENV === 'development') {
  if (!(globalThis as any).client) {
    (globalThis as any).client = new Client();
  }

  client = (globalThis as any).client;
} else {
  client = new Client();
}

client
  .setEndpoint(process.env.BACKEND_ENDPOINT)
  .setProject(process.env.BACKEND_PROJECT_ID)
  .setKey(process.env.BACKEND_API_KEY)
  .setSelfSigned();

interface Item extends Models.Document {
  label?: string;
  link: string;
  tags: string[];
}

export async function fetchPublicLinks() {
  const db = new Databases(client);
  const { 
    BACKEND_LINKS_DB_ID: dbId,
    BACKEND_PUBLIC_LINKS_COLLECTION_ID: colId
   } = process.env;
  const docs = await db.listDocuments<Item>(dbId, colId);
  return docs.documents;
}
