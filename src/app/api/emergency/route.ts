import { jsonError, jsonOk, withAuth } from "@/lib/api";
import { doctorName, newId, nowTimeStr, patientName, todayISO } from "@/lib/helpers";
import { readDb, updateDb } from "@/lib/store";
import type { EmergencyPatient } from "@/lib/types";

export async function GET() {
  const { error } = await withAuth();
  if (error) return error;
  const db = await readDb();

  return jsonOk(
    db.emergencyPatients.map((e) => {
      const patient = db.patients.find((p) => p.id === e.patientId);
      const doctor = db.doctors.find((d) => d.id === e.attendingDoctorId);
      return {
        ...e,
        patientName: patient?.name ?? "Unknown",
        patientMrn: patient?.mrn ?? "",
        patientAge: patient?.age ?? 0,
        patientGender: patient?.gender ?? "Unknown",
        patientBloodGroup: patient?.bloodGroup ?? "",
        doctorName: doctor?.name ?? "On-duty ER Medical Officer",
      };
    }),
  );
}

export async function POST(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as Partial<EmergencyPatient>;
  if (!body.patientId || !body.chiefComplaint) {
    return jsonError("Patient and chief complaint are required", 400);
  }

  const db = await readDb();
  const erCase: EmergencyPatient = {
    id: newId("er"),
    patientId: body.patientId,
    triageLevel: body.triageLevel || "Yellow",
    bedNumber: body.bedNumber || "ER-Triage-Bay",
    chiefComplaint: body.chiefComplaint,
    vitals: body.vitals || {
      bp: "120/80",
      pulse: 80,
      temperature: 98.6,
      spO2: 98,
      recordedAt: `${todayISO()} ${nowTimeStr()}`,
    },
    attendingDoctorId: body.attendingDoctorId || db.doctors.find((d) => d.department === "Emergency Medicine")?.id || db.doctors[0]?.id,
    arrivalTime: `${todayISO()} ${nowTimeStr()}`,
    status: "Treatment",
    notes: body.notes || "",
  };

  await updateDb((database) => {
    database.emergencyPatients.unshift(erCase);
    const p = database.patients.find((pt) => pt.id === body.patientId);
    if (p) {
      p.status = "Emergency";
      if (body.vitals) p.vitals = body.vitals;
    }
  });

  return jsonOk(erCase, 201);
}

export async function PATCH(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as {
    id: string;
    status?: EmergencyPatient["status"];
    triageLevel?: EmergencyPatient["triageLevel"];
    bedNumber?: string;
    notes?: string;
  };

  if (!body.id) return jsonError("Case ID required", 400);
  let found = false;
  await updateDb((db) => {
    const item = db.emergencyPatients.find((e) => e.id === body.id);
    if (item) {
      if (body.status) item.status = body.status;
      if (body.triageLevel) item.triageLevel = body.triageLevel;
      if (body.bedNumber) item.bedNumber = body.bedNumber;
      if (body.notes !== undefined) item.notes = body.notes;
      found = true;

      // Update patient status if discharged
      if (body.status === "Discharged") {
        const p = db.patients.find((pt) => pt.id === item.patientId);
        if (p) p.status = "Discharged";
      }
    }
  });

  if (!found) return jsonError("Emergency case not found", 404);
  return jsonOk({ ok: true });
}
