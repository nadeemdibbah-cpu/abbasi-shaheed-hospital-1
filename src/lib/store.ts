import { promises as fs } from "fs";
import path from "path";
import { seed } from "./seed";
import type { Database } from "./types";

// On Vercel (and other serverless platforms), the filesystem outside /tmp is
// read-only at runtime, so fs.mkdir / fs.writeFile will throw.
// We use /tmp as the data directory in production and fall back to a deep-cloned
// in-memory copy of seed data when even /tmp is unavailable.

const IS_PROD = process.env.NODE_ENV === "production";
const dataDir = IS_PROD
  ? path.join("/tmp", "ash_data")
  : path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "db.json");

// In-memory fallback — used when the filesystem is completely unavailable.
let memoryDb: Database | null = null;

function deepCloneSeed(): Database {
  return JSON.parse(JSON.stringify(seed)) as Database;
}

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDb(): Promise<void> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try {
      await fs.access(dbPath);
      // Patch any missing keys from seed without overwriting existing data
      const raw = await fs.readFile(dbPath, "utf8");
      const parsed = JSON.parse(raw) as Partial<Database>;
      let modified = false;
      for (const key of Object.keys(seed) as (keyof Database)[]) {
        if (!parsed[key]) {
          (parsed as Database)[key] = seed[key] as never;
          modified = true;
        }
      }
      if (modified) {
        await fs.writeFile(dbPath, JSON.stringify(parsed, null, 2), "utf8");
      }
    } catch {
      // db.json doesn't exist yet — write fresh seed
      await fs.writeFile(dbPath, JSON.stringify(seed, null, 2), "utf8");
    }
    // If we get here the filesystem is working; clear the memory fallback
    memoryDb = null;
  } catch {
    // Filesystem is read-only (e.g. Vercel Lambda outside /tmp).
    // Initialise the in-memory store from seed if not already done.
    if (!memoryDb) {
      memoryDb = deepCloneSeed();
    }
  }
}

export async function readDb(): Promise<Database> {
  await ensureDb();
  if (memoryDb) return memoryDb;
  const raw = await fs.readFile(dbPath, "utf8");
  const parsed = JSON.parse(raw) as Partial<Database>;
  return {
    users: parsed.users ?? seed.users,
    patients: parsed.patients ?? seed.patients,
    doctors: parsed.doctors ?? seed.doctors,
    appointments: parsed.appointments ?? seed.appointments,
    records: parsed.records ?? seed.records,
    emergencyPatients: parsed.emergencyPatients ?? seed.emergencyPatients,
    wardBeds: parsed.wardBeds ?? seed.wardBeds,
    labOrders: parsed.labOrders ?? seed.labOrders,
    medicines: parsed.medicines ?? seed.medicines,
    invoices: parsed.invoices ?? seed.invoices,
  };
}

export async function writeDb(mutator: (db: Database) => void | Database) {
  writeQueue = writeQueue.then(async () => {
    const db = await readDb();
    const next = mutator(db) ?? db;
    if (memoryDb) {
      // Persist changes into the in-memory store
      memoryDb = next as Database;
      return;
    }
    await fs.writeFile(dbPath, JSON.stringify(next, null, 2), "utf8");
  });
  await writeQueue;
}

export async function updateDb(mutator: (db: Database) => void): Promise<Database> {
  let snapshot: Database = await readDb();
  await writeDb((db) => {
    mutator(db);
    snapshot = db;
    return db;
  });
  return snapshot;
}

export async function resetDb(): Promise<Database> {
  if (memoryDb) {
    memoryDb = deepCloneSeed();
    return memoryDb;
  }
  await fs.writeFile(dbPath, JSON.stringify(seed, null, 2), "utf8");
  return seed;
}
