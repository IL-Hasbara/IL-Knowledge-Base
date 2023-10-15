import { json } from '@remix-run/node';
import { Client, Databases, Models, ID, Query } from 'node-appwrite';
import { randomBytes } from 'crypto';

const key = randomBytes(10).toString('hex');

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BACKEND_ENDPOINT: string;
      BACKEND_PROJECT_ID: string;
      BACKEND_API_KEY: string;
      BACKEND_LINKS_DB_ID: string;
      BACKEND_PUBLIC_LINKS_COLLECTION_ID: string;
      BACKEND_ACCESS_KEYS_COLLECTION_ID: string;
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

interface LinkItem extends Models.Document {
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
  const docs = await db.listDocuments<LinkItem>(dbId, colId);
  return docs.documents;
}

type SubmittedLinkPayload = {
  key: string;
  link: string;
  label: string;
  tags: string[];
}
export async function submitLink({ key: accessKey, ...payload }: SubmittedLinkPayload) {
  const db = new Databases(client);
  const { 
    BACKEND_LINKS_DB_ID: dbId,
    BACKEND_PUBLIC_LINKS_COLLECTION_ID: colId
   } = process.env;

  await validateAccessKey(accessKey);


  const linkItem = await db.createDocument<LinkItem>(dbId, colId, ID.unique(), payload);
  return json({ link: linkItem, error: null });
}

interface AccessKeyItem extends Models.Document {
  key: string;
  active: boolean;
  holder: string;
  email: string;
  acquired: string;
}
export async function validateAccessKey(key: string) {
  const db = new Databases(client);
  const { 
    BACKEND_LINKS_DB_ID: dbId,
    BACKEND_ACCESS_KEYS_COLLECTION_ID: accessKeyColId
   } = process.env;

  const accessKeys = await db.listDocuments<AccessKeyItem>(dbId, accessKeyColId, [Query.equal('key', key)]);
  if (typeof accessKeys?.documents?.[0]?.active === 'boolean' && accessKeys.documents[0].active) {
    return accessKeys.documents[0];
  }

  throw new Error('Invalid access key!');
}
