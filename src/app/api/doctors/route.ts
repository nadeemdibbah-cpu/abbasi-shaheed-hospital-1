import { jsonError, jsonOk, withAuth } from "@/lib/api";
import { newId } from "@/lib/helpers";
import { readDb, updateDb } from "@/lib/store";
import type { Doctor } from "@/lib/types";

export async function GET() {
  const { error } = await withAuth();
  if (error) return error;
  const db = await readDb();
  return jsonOk(db.doctors);
}

export async function POST(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as Partial<Doctor>;
  if (!body.name || !body.specialty || !body.department) {
    return jsonError("Doctor name, specialty, and department are required", 400);
  }
  const doctor: Doctor = {
    id: newId("d"),
    name: body.name.trim(),
    specialty: body.specialty.trim(),
    department: body.department.trim(),
    qualification: body.qualification?.trim() || "MBBS",
    pmdcReg: body.pmdcReg?.trim() || `PMC-${Math.floor(10000 + Math.random() * 90000)}-S`,
    roomNo: body.roomNo?.trim() || "OPD Clinic #05",
    phone: body.phone?.trim() || "021-99260300",
    email: body.email?.trim() || "doctor@ash.org.pk",
    days: body.days?.trim() || "Mon–Sat",
    timing: body.timing?.trim() || "09:00 AM – 02:00 PM",
    fee: Number(body.fee || 200),
    maxDailyTokens: Number(body.maxDailyTokens || 40),
    status: body.status || "Available",
  };
  await updateDb((db) => {
    db.doctors.push(doctor);
  });
  return jsonOk(doctor, 201);
}

export async function PATCH(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as { id: string; status?: Doctor["status"] } & Partial<Doctor>;
  if (!body.id) return jsonError("Doctor ID is required", 400);

  let updated: Doctor | undefined;
  await updateDb((db) => {
    const doc = db.doctors.find((d) => d.id === body.id);
    if (!doc) return;
    if (body.status) doc.status = body.status;
    if (body.timing) doc.timing = body.timing;
    if (body.days) doc.days = body.days;
    if (body.roomNo) doc.roomNo = body.roomNo;
    if (body.fee !== undefined) doc.fee = Number(body.fee);
    updated = doc;
  });

  if (!updated) return jsonError("Doctor not found", 404);
  return jsonOk(updated);
}
