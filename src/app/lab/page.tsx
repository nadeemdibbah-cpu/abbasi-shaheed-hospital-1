"use client";

import { AppShell, HospitalPrintHeader, PageTitle, StatusBadge } from "@/components/ui";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Filter,
  FlaskConical,
  Plus,
  Printer,
  Search,
  Stethoscope,
  Trash2,
  Users,
} from "lucide-react";
import type { Doctor, LabOrder, LabTestItem, Patient } from "@/lib/types";

type LabRow = LabOrder & {
  patientName: string;
  patientMrn: string;
  patientAge: number;
  patientGender: string;
  doctorName: string;
};

export default function LabPage() {
  const [orders, setOrders] = useState<LabRow[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [q, setQ] = useState("");
  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [selectedOrderToResult, setSelectedOrderToResult] = useState<LabRow | null>(null);
  const [printingOrder, setPrintingOrder] = useState<LabRow | null>(null);
  const [loading, setLoading] = useState(false);

  // New Order Form
  const [orderForm, setOrderForm] = useState({
    patientId: "",
    doctorId: "",
    test: "",
    category: "Biochemistry" as LabOrder["category"],
    doctorNotes: "",
  });

  // Result Entry Form
  const [resultParams, setResultParams] = useState<LabTestItem[]>([
    { name: "Hemoglobin (Hb)", value: "13.5", unit: "g/dL", normalRange: "13.0 - 17.0", isAbnormal: false },
  ]);
  const [pathologistRemarks, setPathologistRemarks] = useState("");
  const [technicianName, setTechnicianName] = useState("Central Pathology MLT");

  function loadData() {
    fetch("/api/lab")
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => {});

    fetch("/api/patients")
      .then((r) => r.json())
      .then(setPatients)
      .catch(() => {});

    fetch("/api/doctors")
      .then((r) => r.json())
      .then(setDoctors)
      .catch(() => {});
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createOrder(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/lab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderForm),
    });
    setLoading(false);
    if (res.ok) {
      setOpenOrderModal(false);
      setOrderForm({
        patientId: "",
        doctorId: "",
        test: "",
        category: "Biochemistry",
        doctorNotes: "",
      });
      loadData();
    }
  }

  async function updateOrderStatus(id: string, status: LabOrder["status"]) {
    await fetch("/api/lab", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadData();
  }

  function addParamRow() {
    setResultParams([
      ...resultParams,
      { name: "", value: "", unit: "", normalRange: "", isAbnormal: false },
    ]);
  }

  function removeParamRow(idx: number) {
    setResultParams(resultParams.filter((_, i) => i !== idx));
  }

  function updateParamField(idx: number, field: keyof LabTestItem, val: string | boolean) {
    const next = [...resultParams];
    next[idx] = { ...next[idx], [field]: val };
    setResultParams(next);
  }

  async function submitResults(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrderToResult) return;
    setLoading(true);
    const res = await fetch("/api/lab", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedOrderToResult.id,
        status: "Completed",
        results: resultParams.filter((p) => p.name.trim().length > 0),
        doctorNotes: pathologistRemarks,
        technicianName,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setSelectedOrderToResult(null);
      loadData();
    }
  }

  const filtered = orders.filter((o) => {
    const matchQ = `${o.test} ${o.patientName} ${o.patientMrn}`
      .toLowerCase()
      .includes(q.toLowerCase());
    const matchCat = selectedCategory === "All" || o.category === selectedCategory;
    const matchStatus = selectedStatus === "All" || o.status === selectedStatus;
    return matchQ && matchCat && matchStatus;
  });

  return (
    <AppShell>
      <PageTitle
        title="Central Diagnostic Laboratory & Pathology"
        subtitle="Test order book, specimen tracking, diagnostic reporting & critical values."
      >
        <button
          onClick={() => window.print()}
          className="btn btn-ghost text-xs flex items-center gap-1.5 no-print"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Lab Roster</span>
        </button>
        <button
          onClick={() => setOpenOrderModal(true)}
          className="btn btn-primary text-xs flex items-center gap-1.5 no-print"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Order Diagnostic Test</span>
        </button>
      </PageTitle>

      <HospitalPrintHeader documentTitle="CENTRAL PATHOLOGY & DIAGNOSTIC LABORATORY REPORT" />

      {/* Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9 text-xs"
            placeholder="Search test name, patient name, MRN..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <select
            className="select text-xs max-w-[160px]"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Hematology">Hematology</option>
            <option value="Biochemistry">Biochemistry</option>
            <option value="Radiology">Radiology & X-Ray</option>
            <option value="Microbiology">Microbiology</option>
            <option value="Pathology">Pathology</option>
            <option value="Cardiology">Cardiology</option>
          </select>

          <select
            className="select text-xs max-w-[160px]"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Ordered">Ordered</option>
            <option value="Sample Collected">Sample Collected</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Lab Orders List */}
      <div className="space-y-4">
        {filtered.map((o) => (
          <div
            key={o.id}
            className="card p-5 border-l-4 border-l-indigo-600 transition-all hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {o.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{o.test}</h3>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Patient:{" "}
                  <Link
                    href={`/patients/${o.patientId}`}
                    className="font-bold text-teal-800 hover:underline"
                  >
                    {o.patientName} ({o.patientMrn})
                  </Link>{" "}
                  · Ordered by: <strong className="text-slate-800">{o.doctorName}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge value={o.status} />
                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                  {o.orderedAt}
                </span>
              </div>
            </div>

            {/* Test Results Table (if completed) */}
            {o.results && o.results.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="table text-xs">
                  <thead>
                    <tr>
                      <th>Test Parameter</th>
                      <th>Result Value</th>
                      <th>Unit</th>
                      <th>Reference Range</th>
                      <th>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.results.map((res, idx) => (
                      <tr
                        key={idx}
                        className={res.isAbnormal ? "bg-red-50/50 font-semibold" : ""}
                      >
                        <td>{res.name}</td>
                        <td
                          className={`font-mono text-sm ${
                            res.isAbnormal ? "text-red-700 font-bold" : "text-slate-900"
                          }`}
                        >
                          {res.value}
                        </td>
                        <td className="text-slate-500 font-mono">{res.unit}</td>
                        <td className="text-slate-500 font-mono">{res.normalRange}</td>
                        <td>
                          {res.isAbnormal ? (
                            <span className="badge badge-red font-bold">ABNORMAL</span>
                          ) : (
                            <span className="badge badge-green">NORMAL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {o.doctorNotes ? (
              <div className="mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-700">Remarks / Interpretation:</strong> {o.doctorNotes}
              </div>
            ) : null}

            {o.technicianName ? (
              <p className="text-[11px] text-slate-500 mt-2 font-mono">
                Verified by: {o.technicianName} {o.completedAt ? `· Completed: ${o.completedAt}` : ""}
              </p>
            ) : null}

            {/* Status Pipeline & Action Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 no-print">
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => updateOrderStatus(o.id, "Sample Collected")}
                  className={`btn text-xs py-1 px-2.5 ${
                    o.status === "Sample Collected" ? "btn-primary" : "btn-ghost text-slate-600"
                  }`}
                >
                  1. Sample Collected
                </button>
                <button
                  onClick={() => updateOrderStatus(o.id, "Processing")}
                  className={`btn text-xs py-1 px-2.5 ${
                    o.status === "Processing" ? "btn-primary bg-purple-700" : "btn-ghost text-slate-600"
                  }`}
                >
                  2. In Analyzer
                </button>
              </div>

              <div className="flex items-center gap-2">
                {o.status !== "Completed" ? (
                  <button
                    onClick={() => {
                      setSelectedOrderToResult(o);
                      setResultParams([
                        { name: "Result Value", value: "", unit: "mg/dL", normalRange: "Normal", isAbnormal: false },
                      ]);
                    }}
                    className="btn btn-primary text-xs py-1 px-3 bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Enter Results</span>
                  </button>
                ) : (
                  <button
                    onClick={() => window.print()}
                    className="btn btn-ghost text-xs py-1 px-3 flex items-center gap-1 text-teal-800"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Report</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-slate-400 text-sm">
            No diagnostic laboratory orders match this filter.
          </div>
        ) : null}
      </div>

      {/* Order New Test Modal */}
      {openOrderModal ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={createOrder}
            className="card p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-lg text-slate-900">Order Diagnostic Lab Test</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenOrderModal(false)}
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
                  value={orderForm.patientId}
                  onChange={(e) => setOrderForm({ ...orderForm, patientId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) · Blood: {p.bloodGroup}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lab Category
                  </label>
                  <select
                    className="select"
                    value={orderForm.category}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        category: e.target.value as LabOrder["category"],
                      })
                    }
                  >
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Radiology">Radiology / Imaging</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Pathology">Pathology / Histology</option>
                    <option value="Cardiology">Cardiology (ECG/Echo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ordering Consultant
                  </label>
                  <select
                    className="select"
                    value={orderForm.doctorId}
                    onChange={(e) => setOrderForm({ ...orderForm, doctorId: e.target.value })}
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Test Name & Profile <span className="text-red-600">*</span>
                </label>
                <input
                  className="input font-semibold"
                  placeholder="e.g. STAT Dengue Profile (NS1 & CBC) or Fasting Lipid Profile"
                  value={orderForm.test}
                  onChange={(e) => setOrderForm({ ...orderForm, test: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Indication / Special Instructions
                </label>
                <textarea
                  className="textarea text-xs"
                  rows={2}
                  placeholder="e.g. Fasting 10 hours, STAT urgent delivery, Emergency dengue investigation..."
                  value={orderForm.doctorNotes}
                  onChange={(e) => setOrderForm({ ...orderForm, doctorNotes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpenOrderModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Ordering..." : "Dispatch Lab Order"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Enter Test Results Modal */}
      {selectedOrderToResult ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={submitResults}
            className="card p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Enter Diagnostic Results</h3>
                  <p className="text-xs text-teal-700 font-semibold">
                    {selectedOrderToResult.test} · Patient: {selectedOrderToResult.patientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderToResult(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Test Parameter Parameters
                </p>
                <button
                  type="button"
                  onClick={addParamRow}
                  className="btn btn-outline text-xs py-1 px-2.5"
                >
                  + Add Parameter
                </button>
              </div>

              <div className="space-y-2">
                {resultParams.map((param, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-4">
                      <label className="text-[10px] text-slate-500 font-bold block">
                        Parameter Name
                      </label>
                      <input
                        className="input text-xs"
                        placeholder="e.g. Hemoglobin"
                        value={param.name}
                        onChange={(e) => updateParamField(idx, "name", e.target.value)}
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 font-bold block">Value</label>
                      <input
                        className="input text-xs font-mono font-bold"
                        placeholder="13.5"
                        value={param.value}
                        onChange={(e) => updateParamField(idx, "value", e.target.value)}
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 font-bold block">Unit</label>
                      <input
                        className="input text-xs font-mono"
                        placeholder="g/dL"
                        value={param.unit}
                        onChange={(e) => updateParamField(idx, "unit", e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 font-bold block">
                        Normal Range
                      </label>
                      <input
                        className="input text-xs font-mono"
                        placeholder="13.0 - 17.0"
                        value={param.normalRange}
                        onChange={(e) => updateParamField(idx, "normalRange", e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-1 text-center">
                      <label className="text-[10px] text-red-600 font-bold block">Abnormal</label>
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-red-600 rounded mt-1"
                        checked={param.isAbnormal || false}
                        onChange={(e) => updateParamField(idx, "isAbnormal", e.target.checked)}
                      />
                    </div>

                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeParamRow(idx)}
                        className="text-red-500 hover:text-red-700 mt-3 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pathologist Findings / Impression
                </label>
                <textarea
                  className="textarea text-xs"
                  rows={2}
                  placeholder="e.g. Severe thrombocytopenia with positive NS1. Correlate clinically."
                  value={pathologistRemarks}
                  onChange={(e) => setPathologistRemarks(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Technician Sign-off Name
                </label>
                <input
                  className="input text-xs"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrderToResult(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary bg-emerald-700 hover:bg-emerald-800"
                disabled={loading}
              >
                {loading ? "Publishing..." : "Publish & Complete Lab Report"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
