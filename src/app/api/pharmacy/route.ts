import { jsonError, jsonOk, withAuth } from "@/lib/api";
import { newId } from "@/lib/helpers";
import { readDb, updateDb } from "@/lib/store";
import type { Medicine } from "@/lib/types";

export async function GET(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const db = await readDb();
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.toLowerCase() || "";
  const lowOnly = url.searchParams.get("lowOnly") === "true";

  let list = db.medicines;
  if (q) {
    list = list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    );
  }
  if (lowOnly) {
    list = list.filter((m) => m.stock <= m.minStock);
  }

  return jsonOk(list);
}

export async function POST(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as Partial<Medicine>;
  if (!body.name) return jsonError("Medicine name is required", 400);

  const medicine: Medicine = {
    id: newId("m"),
    name: body.name.trim(),
    genericName: body.genericName?.trim() || body.name.trim(),
    category: body.category?.trim() || "General Medicine",
    dosageForm: body.dosageForm?.trim() || "Tablet",
    stock: Number(body.stock || 0),
    minStock: Number(body.minStock || 20),
    unit: body.unit?.trim() || "tablets",
    price: Number(body.price || 0),
    expiry: body.expiry || "2027-12-31",
    batchNo: body.batchNo?.trim() || `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
    manufacturer: body.manufacturer?.trim() || "Local Pharmaceutical",
  };

  await updateDb((db) => {
    db.medicines.unshift(medicine);
  });
  return jsonOk(medicine, 201);
}

export async function PATCH(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as {
    id: string;
    action: "dispense" | "restock" | "edit";
    quantity?: number;
    medicineData?: Partial<Medicine>;
  };

  if (!body.id) return jsonError("Medicine ID is required", 400);

  let updatedMed: Medicine | undefined;
  let errorMessage: string | null = null;

  await updateDb((db) => {
    const med = db.medicines.find((m) => m.id === body.id);
    if (!med) {
      errorMessage = "Medicine not found";
      return;
    }

    if (body.action === "dispense") {
      const qty = Number(body.quantity || 1);
      if (med.stock < qty) {
        errorMessage = `Insufficient stock! Only ${med.stock} ${med.unit} available.`;
        return;
      }
      med.stock -= qty;
      updatedMed = med;
    } else if (body.action === "restock") {
      const qty = Number(body.quantity || 1);
      med.stock += qty;
      updatedMed = med;
    } else if (body.action === "edit" && body.medicineData) {
      Object.assign(med, body.medicineData);
      updatedMed = med;
    }
  });

  if (errorMessage) return jsonError(errorMessage, 400);
  if (!updatedMed) return jsonError("Could not update medicine", 404);
  return jsonOk(updatedMed);
}
