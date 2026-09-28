import { jsonError, jsonOk, withAuth } from "@/lib/api";
import { generateInvoiceNo, newId, patientName, todayISO } from "@/lib/helpers";
import { readDb, updateDb } from "@/lib/store";
import type { Invoice, InvoiceItem } from "@/lib/types";

export async function GET(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const db = await readDb();
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const patientId = url.searchParams.get("patientId");

  let list = db.invoices;
  if (status && status !== "All") list = list.filter((i) => i.status === status);
  if (patientId) list = list.filter((i) => i.patientId === patientId);

  return jsonOk(
    list.map((i) => {
      const patient = db.patients.find((p) => p.id === i.patientId);
      return {
        ...i,
        patientName: patient?.name ?? "Unknown Patient",
        patientMrn: patient?.mrn ?? "",
        patientPhone: patient?.phone ?? "",
        patientPanel: patient?.panelType ?? "Private",
      };
    }),
  );
}

export async function POST(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as {
    patientId: string;
    items: InvoiceItem[];
    discount?: number;
    subsidyNote?: string;
    paidAmount?: number;
    paymentMethod?: Invoice["paymentMethod"];
    receiptNotes?: string;
  };

  if (!body.patientId || !body.items || body.items.length === 0) {
    return jsonError("Patient and at least one billing item are required", 400);
  }

  const db = await readDb();
  const subtotal = body.items.reduce((sum, item) => sum + Number(item.amount || (item.quantity * item.unitPrice) || 0), 0);
  const discount = Number(body.discount || 0);
  const total = Math.max(0, subtotal - discount);
  const paidAmount = Number(body.paidAmount !== undefined ? body.paidAmount : total);

  let status: Invoice["status"] = "Unpaid";
  if (paidAmount >= total) status = "Paid";
  else if (paidAmount > 0) status = "Partial";

  const invoice: Invoice = {
    id: newId("inv"),
    invoiceNo: generateInvoiceNo(db),
    patientId: body.patientId,
    date: todayISO(),
    items: body.items.map((it) => ({
      description: it.description,
      category: it.category || "Other",
      quantity: Number(it.quantity || 1),
      unitPrice: Number(it.unitPrice || it.amount),
      amount: Number(it.amount || (it.quantity * it.unitPrice)),
    })),
    subtotal,
    discount,
    subsidyNote: body.subsidyNote || "",
    total,
    paidAmount,
    paymentMethod: body.paymentMethod || "Cash",
    status,
    receiptNotes: body.receiptNotes || "Thank you for choosing Abbasi Shaheed Hospital.",
  };

  await updateDb((database) => {
    database.invoices.unshift(invoice);
  });

  return jsonOk(invoice, 201);
}

export async function PATCH(request: Request) {
  const { error } = await withAuth();
  if (error) return error;
  const body = (await request.json()) as {
    id: string;
    paidAmount?: number;
    paymentMethod?: Invoice["paymentMethod"];
    status?: Invoice["status"];
    receiptNotes?: string;
  };

  if (!body.id) return jsonError("Invoice ID is required", 400);

  let updatedInvoice: Invoice | undefined;
  await updateDb((db) => {
    const inv = db.invoices.find((i) => i.id === body.id);
    if (!inv) return;
    if (body.paidAmount !== undefined) {
      inv.paidAmount = Number(body.paidAmount);
      if (inv.paidAmount >= inv.total) inv.status = "Paid";
      else if (inv.paidAmount > 0) inv.status = "Partial";
      else inv.status = "Unpaid";
    }
    if (body.status) inv.status = body.status;
    if (body.paymentMethod) inv.paymentMethod = body.paymentMethod;
    if (body.receiptNotes !== undefined) inv.receiptNotes = body.receiptNotes;
    updatedInvoice = inv;
  });

  if (!updatedInvoice) return jsonError("Invoice not found", 404);
  return jsonOk(updatedInvoice);
}
