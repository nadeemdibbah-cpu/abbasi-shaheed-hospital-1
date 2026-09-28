import { jsonError, jsonOk, withAuth } from "@/lib/api";
import { doctorName, generateToken, newId, patientName } from "@/lib/helpers";
import { readDb, updateDb } from "@/lib/store";
import type { Appointment } from "@/lib/types";

export async function GET(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const db = await readDb();
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const doctorId = url.searchParams.get("doctorId");
  const status = url.searchParams.get("status");

  let list = db.appointments;
  if (date) list = list.filter((a) => a.date === date);
  if (doctorId && doctorId !== "All") list = list.filter((a) => a.doctorId === doctorId);
  if (status && status !== "All") list = list.filter((a) => a.status === status);

  return jsonOk(
    list.map((a) => {
      const patient = db.patients.find((p) => p.id === a.patientId);
      const doctor = db.doctors.find((d) => d.id === a.doctorId);
      return {
        ...a,
        patientName: patient?.name ?? "Unknown",
        patientMrn: patient?.mrn ?? "",
        patientPhone: patient?.phone ?? "",
        doctorName: doctor?.name ?? "Unknown",
        doctorDepartment: doctor?.department ?? a.department,
        doctorRoom: doctor?.roomNo ?? "",
      };
    }),
  );
}

export async function POST(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as Partial<Appointment>;
  if (!body.patientId || !body.doctorId || !body.date) {
    return jsonError("Patient, doctor, and date are required", 400);
  }
  const db = await readDb();
  const doctor = db.doctors.find((d) => d.id === body.doctorId);
  const department = body.department || doctor?.department || "General OPD";

  const created: Appointment = {
    id: newId("a"),
    tokenNo: generateToken(department, db),
    patientId: body.patientId,
    doctorId: body.doctorId,
    date: body.date,
    time: body.time || "10:00 AM",
    department,
    reason: body.reason?.trim() || "Routine OPD Consultation",
    status: (body.status as Appointment["status"]) || "Scheduled",
    priority: (body.priority as Appointment["priority"]) || "Normal",
    notes: body.notes?.trim() || "",
  };

  await updateDb((database) => {
    database.appointments.unshift(created);
  });
  return jsonOk(created, 201);
}

export async function PATCH(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as { id: string; status?: Appointment["status"]; notes?: string };
  if (!body.id) return jsonError("Appointment ID is required", 400);
  let found = false;
  await updateDb((db) => {
    const appt = db.appointments.find((a) => a.id === body.id);
    if (appt) {
      if (body.status) appt.status = body.status;
      if (body.notes !== undefined) appt.notes = body.notes;
      found = true;
    }
  });
  if (!found) return jsonError("Appointment not found", 404);
  return jsonOk({ ok: true });
}
