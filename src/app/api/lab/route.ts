import { jsonError, jsonOk, withAuth } from "@/lib/api";
import { doctorName, newId, nowTimeStr, patientName, todayISO } from "@/lib/helpers";
import { readDb, updateDb } from "@/lib/store";
import type { LabOrder, LabTestItem } from "@/lib/types";

export async function GET() {
  const { error } = await withAuth();
  if (error) return error;
  const db = await readDb();

  return jsonOk(
    db.labOrders.map((l) => {
      const patient = db.patients.find((p) => p.id === l.patientId);
      const doctor = l.doctorId ? db.doctors.find((d) => d.id === l.doctorId) : undefined;
      return {
        ...l,
        patientName: patient?.name ?? "Unknown",
        patientMrn: patient?.mrn ?? "",
        patientAge: patient?.age ?? 0,
        patientGender: patient?.gender ?? "",
        doctorName: doctor?.name ?? "Attending Medical Officer",
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
    test: string;
    category?: LabOrder["category"];
    doctorNotes?: string;
  };

  if (!body.patientId || !body.test) {
    return jsonError("Patient and test are required", 400);
  }

  const db = await readDb();
  const order: LabOrder = {
    id: newId("l"),
    patientId: body.patientId,
    doctorId: body.doctorId || db.doctors[0]?.id,
    test: body.test,
    category: body.category || "Biochemistry",
    orderedAt: `${todayISO()} ${nowTimeStr()}`,
    status: "Ordered",
    doctorNotes: body.doctorNotes || "",
  };

  await updateDb((database) => {
    database.labOrders.unshift(order);
  });

  return jsonOk(order, 201);
}

export async function PATCH(request: Request) {
  const { session, error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as {
    id: string;
    status?: LabOrder["status"];
    results?: LabTestItem[];
    doctorNotes?: string;
    technicianName?: string;
  };

  if (!body.id) return jsonError("Order ID required", 400);

  let found = false;
  await updateDb((db) => {
    const order = db.labOrders.find((l) => l.id === body.id);
    if (!order) return;
    if (body.status) order.status = body.status;
    if (body.results) order.results = body.results;
    if (body.doctorNotes !== undefined) order.doctorNotes = body.doctorNotes;
    if (body.technicianName) order.technicianName = body.technicianName;
    else if (body.status === "Completed" && !order.technicianName) {
      order.technicianName = session?.name || "Pathology MLT";
    }
    if (body.status === "Completed" && !order.completedAt) {
      order.completedAt = `${todayISO()} ${nowTimeStr()}`;
    }
    found = true;
  });

  if (!found) return jsonError("Lab order not found", 404);
  return jsonOk({ ok: true });
}
