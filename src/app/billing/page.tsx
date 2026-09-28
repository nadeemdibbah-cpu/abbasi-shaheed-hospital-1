"use client";

import { AppShell, HospitalPrintHeader, PageTitle, StatusBadge } from "@/components/ui";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Filter,
  Plus,
  Printer,
  Receipt,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import type { Invoice, InvoiceItem, Patient } from "@/lib/types";

type InvoiceRow = Invoice & {
  patientName: string;
  patientMrn: string;
  patientPhone: string;
  patientPanel: string;
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<InvoiceRow | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<Invoice["paymentMethod"]>("Cash");
  const [activePrintInv, setActivePrintInv] = useState<InvoiceRow | null>(null);
  const [loading, setLoading] = useState(false);

  // New Invoice Form
  const [form, setForm] = useState({
    patientId: "",
    paymentMethod: "Cash" as Invoice["paymentMethod"],
    discount: 0,
    subsidyNote: "",
    paidAmount: 0,
    receiptNotes: "Paid in full at OPD Cash Counter #01. Thank you.",
    items: [
      {
        description: "OPD Consultation Fee",
        category: "Consultation" as InvoiceItem["category"],
        quantity: 1,
        unitPrice: 200,
        amount: 200,
      },
    ] as InvoiceItem[],
  });

  function loadInvoices() {
    let url = "/api/billing";
    if (statusFilter !== "All") url += `?status=${statusFilter}`;

    fetch(url)
      .then((r) => r.json())
      .then(setInvoices)
      .catch(() => {});

    fetch("/api/patients")
      .then((r) => r.json())
      .then(setPatients)
      .catch(() => {});
  }

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  function addItemRow() {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          description: "",
          category: "Lab",
          quantity: 1,
          unitPrice: 500,
          amount: 500,
        },
      ],
    });
  }

  function removeItemRow(idx: number) {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== idx),
    });
  }

  function updateItem(idx: number, field: keyof InvoiceItem, val: string | number) {
    const next = [...form.items];
    const curr = { ...next[idx], [field]: val };
    if (field === "quantity" || field === "unitPrice") {
      curr.amount = Number(curr.quantity || 1) * Number(curr.unitPrice || 0);
    }
    next[idx] = curr;
    setForm({ ...form, items: next });
  }

  const subtotal = form.items.reduce((sum, it) => sum + (it.amount || it.quantity * it.unitPrice || 0), 0);
  const netTotal = Math.max(0, subtotal - Number(form.discount || 0));

  async function createInvoice(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: form.patientId,
        paymentMethod: form.paymentMethod,
        discount: Number(form.discount),
        subsidyNote: form.subsidyNote,
        paidAmount: Number(form.paidAmount !== undefined ? form.paidAmount : netTotal),
        receiptNotes: form.receiptNotes,
        items: form.items.filter((it) => it.description.trim().length > 0),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpenModal(false);
      setForm({
        patientId: "",
        paymentMethod: "Cash",
        discount: 0,
        subsidyNote: "",
        paidAmount: 0,
        receiptNotes: "Paid at Central Cashier Counter. Thank you.",
        items: [
          {
            description: "OPD Consultation Fee",
            category: "Consultation",
            quantity: 1,
            unitPrice: 200,
            amount: 200,
          },
        ],
      });
      loadInvoices();
    }
  }

  async function recordPayment(e: FormEvent) {
    e.preventDefault();
    if (!selectedInvoiceToPay) return;
    setLoading(true);
    const res = await fetch("/api/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedInvoiceToPay.id,
        paidAmount: Number(payAmount),
        paymentMethod: payMethod,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setSelectedInvoiceToPay(null);
      loadInvoices();
    }
  }

  const filtered = invoices.filter((i) => {
    const matchQ = `${i.invoiceNo} ${i.patientName} ${i.patientMrn}`
      .toLowerCase()
      .includes(q.toLowerCase());
    return matchQ;
  });

  const totalBilled = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalCollected = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  const totalOutstanding = totalBilled - totalCollected;

  return (
    <AppShell>
      <PageTitle
        title="Central Hospital Billing & Cashier Desk"
        subtitle="OPD consultation tokens, laboratory charges, pharmacy receipts & Sehat Sahulat subsidies."
      >
        <button
          onClick={() => window.print()}
          className="btn btn-ghost text-xs flex items-center gap-1.5 no-print"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Billing Ledger</span>
        </button>
        <button
          onClick={() => setOpenModal(true)}
          className="btn btn-primary text-xs flex items-center gap-1.5 no-print"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create New Invoice</span>
        </button>
      </PageTitle>

      <HospitalPrintHeader documentTitle="OFFICIAL PATIENT BILLING & CASHIER RECEIPT LEDGER" />

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 no-print">
        <div className="card p-4 border-l-4 border-l-teal-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Billed</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            Rs {totalBilled.toLocaleString()}
          </p>
          <p className="text-xs text-teal-700 font-medium mt-0.5">Across all hospital departments</p>
        </div>

        <div className="card p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Collected</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            Rs {totalCollected.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-700 font-medium mt-0.5">Realized hospital revenue</p>
        </div>

        <div className="card p-4 border-l-4 border-l-rose-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Balance</p>
          <p className="text-2xl font-black text-rose-700 mt-1">
            Rs {totalOutstanding.toLocaleString()}
          </p>
          <p className="text-xs text-rose-600 font-medium mt-0.5">Pending insurance / patient dues</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9 text-xs"
            placeholder="Search by Invoice No (e.g. ASH-INV-2026-0041), Patient, MRN..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["All", "Paid", "Partial", "Unpaid"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {st} Invoices
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Patient Details</th>
                <th>Service Items</th>
                <th>Total / Subsidy</th>
                <th>Paid Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th className="no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                      {inv.invoiceNo || inv.id}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">{inv.date}</p>
                  </td>

                  <td>
                    <Link
                      href={`/patients/${inv.patientId}`}
                      className="font-bold text-slate-900 hover:text-teal-700 text-sm"
                    >
                      {inv.patientName}
                    </Link>
                    <p className="text-xs text-slate-500 font-mono">{inv.patientMrn}</p>
                    <p className="text-[11px] text-slate-400">{inv.patientPanel}</p>
                  </td>

                  <td className="max-w-xs">
                    <div className="space-y-1 text-xs">
                      {inv.items.map((it, idx) => (
                        <p key={idx} className="text-slate-700">
                          • {it.description}{" "}
                          <span className="text-slate-400 font-mono">
                            (Rs {it.amount})
                          </span>
                        </p>
                      ))}
                    </div>
                  </td>

                  <td>
                    <p className="font-mono font-bold text-slate-900 text-sm">
                      Rs {inv.total.toLocaleString()}
                    </p>
                    {inv.discount > 0 ? (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        - Rs {inv.discount.toLocaleString()} (Subsidy)
                      </p>
                    ) : null}
                  </td>

                  <td>
                    <p className="font-mono font-semibold text-slate-800 text-xs">
                      Rs {(inv.paidAmount || 0).toLocaleString()}
                    </p>
                    {inv.total - (inv.paidAmount || 0) > 0 ? (
                      <p className="text-[11px] text-rose-600 font-mono">
                        Due: Rs {(inv.total - (inv.paidAmount || 0)).toLocaleString()}
                      </p>
                    ) : null}
                  </td>

                  <td>
                    <span className="text-xs font-semibold text-slate-700">{inv.paymentMethod}</span>
                  </td>

                  <td>
                    <StatusBadge value={inv.status} />
                  </td>

                  <td className="no-print whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setActivePrintInv(inv);
                          setTimeout(() => window.print(), 100);
                        }}
                        className="btn btn-ghost text-xs p-1.5 text-teal-800"
                        title="Print Official Thermal / A4 Receipt"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>

                      {inv.status !== "Paid" ? (
                        <button
                          onClick={() => {
                            setSelectedInvoiceToPay(inv);
                            setPayAmount(inv.total);
                          }}
                          className="btn btn-primary text-xs py-1 px-2.5 bg-emerald-700 hover:bg-emerald-800"
                        >
                          Settle
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-sm">
                    No hospital invoices match your current filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle / Pay Invoice Modal */}
      {selectedInvoiceToPay ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={recordPayment}
            className="card p-6 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Record Cashier Payment</h3>
                  <p className="text-xs text-teal-700 font-mono">
                    {selectedInvoiceToPay.invoiceNo} · {selectedInvoiceToPay.patientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceToPay(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <p>
                  Total Bill:{" "}
                  <strong className="font-mono text-slate-900">
                    Rs {selectedInvoiceToPay.total.toLocaleString()}
                  </strong>
                </p>
                <p>
                  Previously Paid:{" "}
                  <strong className="font-mono text-slate-900">
                    Rs {selectedInvoiceToPay.paidAmount.toLocaleString()}
                  </strong>
                </p>
                <p>
                  Remaining Due:{" "}
                  <strong className="font-mono text-rose-700">
                    Rs{" "}
                    {(
                      selectedInvoiceToPay.total - selectedInvoiceToPay.paidAmount
                    ).toLocaleString()}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount Received (PKR)
                </label>
                <input
                  type="number"
                  className="input font-mono text-lg font-bold"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Channel
                </label>
                <select
                  className="select"
                  value={payMethod}
                  onChange={(e) =>
                    setPayMethod(e.target.value as Invoice["paymentMethod"])
                  }
                >
                  <option value="Cash">Cash at Counter</option>
                  <option value="Card">Debit / Credit Card POS</option>
                  <option value="Sehat Sahulat">Sehat Sahulat Health Card</option>
                  <option value="Online">Online Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedInvoiceToPay(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary bg-emerald-700 hover:bg-emerald-800"
                disabled={loading}
              >
                {loading ? "Recording..." : "Record Payment & Issue Receipt"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Create Invoice Modal */}
      {openModal ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={createInvoice}
            className="card p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-lg text-slate-900">Generate Hospital Bill / Invoice</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Patient <span className="text-red-600">*</span>
                </label>
                <select
                  className="select"
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) · Panel: {p.panelType}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Line Items */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Service Line Items
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="btn btn-outline text-xs py-1 px-2.5 bg-white"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          className="input text-xs"
                          placeholder="Service description (e.g. CBC Test, X-Ray)"
                          value={item.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          required
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <select
                          className="select text-xs"
                          value={item.category}
                          onChange={(e) => updateItem(idx, "category", e.target.value)}
                        >
                          <option value="Consultation">Consultation</option>
                          <option value="Lab">Laboratory</option>
                          <option value="Pharmacy">Pharmacy</option>
                          <option value="Procedure">Procedure</option>
                          <option value="Bed Charge">Bed Charge</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="sm:col-span-1">
                        <input
                          type="number"
                          min="1"
                          className="input text-xs font-mono"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          className="input text-xs font-mono font-bold"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                        />
                      </div>

                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal, Subsidy & Net */}
              <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-bold text-sm">Rs {subtotal.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Subsidy / Welfare Discount (Rs)
                    </label>
                    <input
                      type="number"
                      className="input text-xs font-mono"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Subsidy Justification
                    </label>
                    <input
                      className="input text-xs"
                      placeholder="e.g. 50% Sehat Sahulat Health Card"
                      value={form.subsidyNote}
                      onChange={(e) => setForm({ ...form, subsidyNote: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-teal-900 font-bold text-base pt-2 border-t border-teal-200">
                  <span>Net Amount Payable:</span>
                  <span className="font-mono text-lg font-black">
                    Rs {netTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    className="select"
                    value={form.paymentMethod}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        paymentMethod: e.target.value as Invoice["paymentMethod"],
                      })
                    }
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card POS</option>
                    <option value="Sehat Sahulat">Sehat Sahulat Card</option>
                    <option value="Online">Online Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount Paid at Counter
                  </label>
                  <input
                    type="number"
                    className="input font-mono font-bold"
                    value={form.paidAmount || netTotal}
                    onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Remarks</label>
                <input
                  className="input text-xs"
                  value={form.receiptNotes}
                  onChange={(e) => setForm({ ...form, receiptNotes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Generating..." : "Generate Invoice & Receipt"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
