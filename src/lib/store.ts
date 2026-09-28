import { promises as fs } from "fs";
import path from "path";
import { seed } from "./seed";
import type { Database } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "db.json");

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDb() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dbPath);
    // Ensure all seed arrays exist if previous schema was partial
    const raw = await fs.readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw);
    let modified = false;
    for (const key of Object.keys(seed) as (keyof Database)[]) {
      if (!parsed[key]) {
        parsed[key] = seed[key];
        modified = true;
      }
    }
    if (modified) {
      await fs.writeFile(dbPath, JSON.stringify(parsed, null, 2), "utf8");
    }
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(seed, null, 2), "utf8");
  }
}

export async function readDb(): Promise<Database> {
  await ensureDb();
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
  await fs.writeFile(dbPath, JSON.stringify(seed, null, 2), "utf8");
  return seed;
}
