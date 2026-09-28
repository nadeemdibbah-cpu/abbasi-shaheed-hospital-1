import { jsonError, jsonOk, withAuth } from "@/lib/api";
import { doctorName, newId, nowTimeStr, patientName, todayISO } from "@/lib/helpers";
import { readDb, updateDb } from "@/lib/store";
import type { PrescriptionItem, RecordNote, Vitals } from "@/lib/types";

export async function GET(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const db = await readDb();
  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId");
  const doctorId = url.searchParams.get("doctorId");

  let list = db.records;
  if (patientId) list = list.filter((r) => r.patientId === patientId);
  if (doctorId) list = list.filter((r) => r.doctorId === doctorId);

  return jsonOk(
    list.map((r) => {
      const patient = db.patients.find((p) => p.id === r.patientId);
      const doctor = db.doctors.find((d) => d.id === r.doctorId);
      return {
        ...r,
        patientName: patient?.name ?? "Unknown",
        patientMrn: patient?.mrn ?? "",
        doctorName: doctor?.name ?? "Unknown",
        doctorDepartment: doctor?.department ?? "",
      };
    }),
  );
}

export async function POST(request: Request) {
  const { session, error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as {
    patientId: string;
    doctorId?: string;
    date?: string;
    chiefComplaint: string;
    history?: string;
    examination?: string;
    diagnosis: string;
    icdCode?: string;
    vitals?: Vitals;
    prescription?: PrescriptionItem[];
    labOrdersSuggested?: string[];
    notes?: string;
    followUpDate?: string;
  };

  if (!body.patientId || !body.diagnosis) {
    return jsonError("Patient and diagnosis are required", 400);
  }

  const db = await readDb();
  let doctorId = body.doctorId;
  if (!doctorId && session?.role === "doctor") {
    const matched = db.doctors.find((d) => d.name === session.name);
    doctorId = matched ? matched.id : db.doctors[0]?.id;
  }
  if (!doctorId) doctorId = db.doctors[0]?.id;

  const record: RecordNote = {
    id: newId("r"),
    patientId: body.patientId,
    doctorId,
    date: body.date || todayISO(),
    time: nowTimeStr(),
    chiefComplaint: body.chiefComplaint || "Routine Consultation",
    history: body.history || "",
    examination: body.examination || "",
    diagnosis: body.diagnosis,
    icdCode: body.icdCode || "",
    vitals: body.vitals,
    prescription: body.prescription || [],
    labOrdersSuggested: body.labOrdersSuggested || [],
    notes: body.notes || "",
    followUpDate: body.followUpDate || "",
  };

  await updateDb((database) => {
    database.records.unshift(record);
    // If vitals provided, also update latest patient vitals
    if (body.vitals) {
      const patient = database.patients.find((p) => p.id === body.patientId);
      if (patient) {
        patient.vitals = body.vitals;
      }
    }
  });

  return jsonOk(record, 201);
}
