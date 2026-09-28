import { jsonError, jsonOk, withAuth } from "@/lib/api";
import { generateMRN, newId, todayISO } from "@/lib/helpers";
import { readDb, updateDb } from "@/lib/store";
import type { Patient } from "@/lib/types";

export async function GET(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const db = await readDb();
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.toLowerCase() || "";
  const status = url.searchParams.get("status");

  let result = db.patients;
  if (q) {
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.cnic.includes(q)
    );
  }
  if (status && status !== "All") {
    result = result.filter((p) => p.status === status);
  }

  return jsonOk(result);
}

export async function POST(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as Partial<Patient>;
  if (!body.name || !body.gender || body.age === undefined || !body.phone) {
    return jsonError("Name, gender, age, and phone are required", 400);
  }
  const db = await readDb();
  const patient: Patient = {
    id: newId("p"),
    mrn: generateMRN(db),
    name: body.name.trim(),
    gender: body.gender,
    age: Number(body.age),
    dob: body.dob || "",
    phone: body.phone.trim(),
    cnic: body.cnic?.trim() || "",
    guardianName: body.guardianName?.trim() || "",
    emergencyContact: body.emergencyContact?.trim() || "",
    address: body.address?.trim() || "",
    bloodGroup: body.bloodGroup || "Unknown",
    allergies: body.allergies?.trim() || "None",
    chronicConditions: body.chronicConditions?.trim() || "None",
    panelType: body.panelType || "Private",
    status: body.status || "Outpatient",
    vitals: body.vitals || {
      bp: "120/80",
      pulse: 75,
      temperature: 98.6,
      spO2: 98,
      recordedAt: todayISO(),
    },
    registeredAt: todayISO(),
  };

  await updateDb((database) => {
    database.patients.unshift(patient);
  });
  return jsonOk(patient, 201);
}
