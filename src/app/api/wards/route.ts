import { jsonError, jsonOk, withAuth } from "@/lib/api";
import { doctorName, nowTimeStr, patientName, todayISO } from "@/lib/helpers";
import { readDb, updateDb } from "@/lib/store";
import type { WardBed } from "@/lib/types";

export async function GET() {
  const { error } = await withAuth();
  if (error) return error;
  const db = await readDb();

  return jsonOk(
    db.wardBeds.map((b) => {
      const patient = b.patientId ? db.patients.find((p) => p.id === b.patientId) : undefined;
      const doctor = b.doctorId ? db.doctors.find((d) => d.id === b.doctorId) : undefined;
      return {
        ...b,
        patientName: patient?.name,
        patientMrn: patient?.mrn,
        patientGender: patient?.gender,
        patientAge: patient?.age,
        doctorName: doctor?.name,
      };
    }),
  );
}

export async function POST(request: Request) {
  // Admit patient to bed
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as {
    bedId: string;
    patientId: string;
    doctorId?: string;
    notes?: string;
  };

  if (!body.bedId || !body.patientId) {
    return jsonError("Bed ID and Patient ID are required", 400);
  }

  const db = await readDb();
  let updatedBed: WardBed | undefined;

  await updateDb((database) => {
    const bed = database.wardBeds.find((b) => b.id === body.bedId);
    if (!bed) return;
    bed.status = "Occupied";
    bed.patientId = body.patientId;
    bed.doctorId = body.doctorId || database.doctors[0]?.id;
    bed.admittedAt = `${todayISO()} ${nowTimeStr()}`;
    bed.notes = body.notes || "Inpatient Admission";
    updatedBed = bed;

    const p = database.patients.find((pt) => pt.id === body.patientId);
    if (p) p.status = "Admitted";
  });

  if (!updatedBed) return jsonError("Bed not found", 404);
  return jsonOk(updatedBed, 200);
}

export async function PATCH(request: Request) {
  // Discharge patient or update bed status (e.g. Cleaning / Available)
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as {
    bedId: string;
    action: "discharge" | "maintenance" | "cleaning" | "available";
    notes?: string;
  };

  if (!body.bedId || !body.action) {
    return jsonError("Bed ID and action are required", 400);
  }

  let success = false;
  await updateDb((db) => {
    const bed = db.wardBeds.find((b) => b.id === body.bedId);
    if (!bed) return;

    if (body.action === "discharge") {
      if (bed.patientId) {
        const p = db.patients.find((pt) => pt.id === bed.patientId);
        if (p) p.status = "Discharged";
      }
      bed.patientId = undefined;
      bed.doctorId = undefined;
      bed.admittedAt = undefined;
      bed.status = "Cleaning";
      bed.notes = "Patient discharged. Bed sanitization required.";
    } else if (body.action === "available") {
      bed.status = "Available";
      bed.notes = body.notes || "Ready for admission";
    } else if (body.action === "cleaning") {
      bed.status = "Cleaning";
      bed.notes = "Sanitization in progress";
    } else if (body.action === "maintenance") {
      bed.status = "Maintenance";
      bed.notes = "Under engineering repair";
    }
    success = true;
  });

  if (!success) return jsonError("Bed not found", 404);
  return jsonOk({ ok: true });
}
