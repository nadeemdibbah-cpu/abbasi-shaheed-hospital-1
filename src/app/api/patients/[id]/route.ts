import { jsonError, jsonOk, withAuth } from "@/lib/api";
import { doctorName } from "@/lib/helpers";
import { readDb, updateDb } from "@/lib/store";
import type { Patient } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { error } = await withAuth();
  if (error) return error;
  const { id } = await ctx.params;
  const db = await readDb();
  const patient = db.patients.find((p) => p.id === id);
  if (!patient) return jsonError("Patient not found", 404);

  const appointments = db.appointments
    .filter((a) => a.patientId === id)
    .map((a) => ({ ...a, doctorName: doctorName(db, a.doctorId) }));

  const records = db.records
    .filter((r) => r.patientId === id)
    .map((r) => ({ ...r, doctorName: doctorName(db, r.doctorId) }));

  const invoices = db.invoices.filter((i) => i.patientId === id);

  const labs = db.labOrders
    .filter((l) => l.patientId === id)
    .map((l) => ({ ...l, doctorName: l.doctorId ? doctorName(db, l.doctorId) : undefined }));

  const bed = db.wardBeds.find((b) => b.patientId === id && b.status === "Occupied");
  const emergencyCase = db.emergencyPatients.find((e) => e.patientId === id);

  return jsonOk({
    patient,
    appointments,
    records,
    invoices,
    labs,
    bed,
    emergencyCase,
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { error } = await withAuth();
  if (error) return error;
  const { id } = await ctx.params;
  const patch = (await request.json()) as Partial<Patient>;
  let updated: Patient | undefined;
  await updateDb((db) => {
    const idx = db.patients.findIndex((p) => p.id === id);
    if (idx === -1) return;
    db.patients[idx] = { ...db.patients[idx], ...patch, id };
    updated = db.patients[idx];
  });
  if (!updated) return jsonError("Patient not found", 404);
  return jsonOk(updated);
}
