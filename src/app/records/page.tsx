"use client";

import { AppShell, HospitalPrintHeader, PageTitle } from "@/components/ui";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Calendar,
  FilePlus,
  FileText,
  Filter,
  Pill,
  Plus,
  Printer,
  Search,
  Stethoscope,
  Trash2,
  Users,
} from "lucide-react";
import type { Doctor, Medicine, Patient, PrescriptionItem, RecordNote, Vitals } from "@/lib/types";

type RecordRow = RecordNote & {
  patientName: string;
  patientMrn: string;
  doctorName: string;
  doctorDepartment: string;
};

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("All");
  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [printRecord, setPrintRecord] = useState<RecordRow | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    chiefComplaint: "",
    history: "",
    examination: "",
    diagnosis: "",
    icdCode: "",
    notes: "",
    followUpDate: "",
    bp: "120/80",
    pulse: 78,
    temperature: 98.6,
    spO2: 98,
    prescription: [
      {
        medicineName: "Paracetamol 500mg",
        dosage: "500mg",
        frequency: "TDS (Thrice daily)",
        duration: "5 days",
        instructions: "Take after meals",
      },
    ] as PrescriptionItem[],
    labOrdersSuggested: "",
  });

  function loadData() {
    let url = "/api/records";
    if (selectedPatient !== "All") url += `?patientId=${selectedPatient}`;

    fetch(url)
      .then((r) => r.json())
      .then(setRecords)
      .catch(() => {});

    fetch("/api/patients")
      .then((r) => r.json())
      .then(setPatients)
      .catch(() => {});

    fetch("/api/doctors")
      .then((r) => r.json())
      .then(setDoctors)
      .catch(() => {});

    fetch("/api/pharmacy")
      .then((r) => r.json())
      .then(setMedicines)
      .catch(() => {});
  }

  useEffect(() => {
    loadData();
  }, [selectedPatient]);

  function addPrescriptionItem() {
    setForm({
      ...form,
      prescription: [
        ...form.prescription,
        {
          medicineName: "",
          dosage: "1 Tab",
          frequency: "BD (Twice daily)",
          duration: "5 days",
          instructions: "After meals",
        },
      ],
    });
  }

  function removePrescriptionItem(idx: number) {
    setForm({
      ...form,
      prescription: form.prescription.filter((_, i) => i !== idx),
    });
  }

  function updateRxItem(idx: number, field: keyof PrescriptionItem, val: string) {
    const next = [...form.prescription];
    next[idx] = { ...next[idx], [field]: val };
    setForm({ ...form, prescription: next });
  }

  async function createRecord(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const labsArray = form.labOrdersSuggested
      ? form.labOrdersSuggested
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: form.patientId,
        doctorId: form.doctorId,
        chiefComplaint: form.chiefComplaint,
        history: form.history,
        examination: form.examination,
        diagnosis: form.diagnosis,
        icdCode: form.icdCode,
        notes: form.notes,
        followUpDate: form.followUpDate,
        prescription: form.prescription.filter((p) => p.medicineName.trim().length > 0),
        labOrdersSuggested: labsArray,
        vitals: {
          bp: form.bp,
          pulse: Number(form.pulse),
          temperature: Number(form.temperature),
          spO2: Number(form.spO2),
          recordedAt: new Date().toISOString().slice(0, 10),
        },
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpenModal(false);
      setForm({
        patientId: "",
        doctorId: "",
        chiefComplaint: "",
        history: "",
        examination: "",
        diagnosis: "",
        icdCode: "",
        notes: "",
        followUpDate: "",
        bp: "120/80",
        pulse: 78,
        temperature: 98.6,
        spO2: 98,
        prescription: [
          {
            medicineName: "Paracetamol 500mg",
            dosage: "500mg",
            frequency: "TDS (Thrice daily)",
            duration: "5 days",
            instructions: "Take after meals",
          },
        ],
        labOrdersSuggested: "",
      });
      loadData();
    }
  }

  const filtered = records.filter((r) => {
    const matchQ = `${r.diagnosis} ${r.patientName} ${r.patientMrn} ${r.doctorName} ${r.chiefComplaint}`
      .toLowerCase()
      .includes(q.toLowerCase());
    return matchQ;
  });

  return (
    <AppShell>
      <PageTitle
        title="Electronic Health Records (EHR) & Prescriptions"
        subtitle="Clinical consultations, physical examination findings, ICD-10 diagnoses & digital Rx builder."
      >
        <button
          onClick={() => window.print()}
          className="btn btn-ghost text-xs flex items-center gap-1.5 no-print"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print All Records</span>
        </button>
        <button
          onClick={() => setOpenModal(true)}
          className="btn btn-primary text-xs flex items-center gap-1.5 no-print"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Clinical Note & Rx</span>
        </button>
      </PageTitle>

      <HospitalPrintHeader documentTitle="CLINICAL CONSULTATION & PRESCRIPTION ARCHIVE" />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9 text-xs"
            placeholder="Search diagnosis, patient name, MRN or symptoms..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <select
          className="select text-xs max-w-[220px]"
          value={selectedPatient}
          onChange={(e) => setSelectedPatient(e.target.value)}
        >
          <option value="All">All Patients ({patients.length})</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.mrn})
            </option>
          ))}
        </select>
      </div>

      {/* EHR Cards List */}
      <div className="space-y-4">
        {filtered.map((r) => (
          <article
            key={r.id}
            className="card p-5 border-l-4 border-l-teal-600 transition-all hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base text-slate-900">{r.diagnosis}</span>
                  {r.icdCode ? (
                    <span className="bg-slate-100 text-slate-700 font-mono text-[11px] px-2 py-0.5 rounded font-bold">
                      ICD: {r.icdCode}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Patient:{" "}
                  <Link
                    href={`/patients/${r.patientId}`}
                    className="font-bold text-teal-800 hover:underline"
                  >
                    {r.patientName} ({r.patientMrn})
                  </Link>{" "}
                  · Consultant: <strong className="text-slate-800">{r.doctorName}</strong> (
                  {r.doctorDepartment})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded">
                  {r.date} {r.time || ""}
                </span>
                <button
                  onClick={() => {
                    setPrintRecord(r);
                    setTimeout(() => window.print(), 100);
                  }}
                  className="btn btn-ghost text-xs p-1.5 no-print"
                  title="Print Official Prescription"
                >
                  <Printer className="h-3.5 w-3.5 text-teal-700" />
                </button>
              </div>
            </div>

            {/* Complaints & Exam Findings */}
            <div className="mt-3 text-xs space-y-1.5">
              <p>
                <strong className="text-slate-700">Chief Complaint:</strong>{" "}
                <span className="text-slate-800">{r.chiefComplaint}</span>
              </p>
              {r.history ? (
                <p>
                  <strong className="text-slate-700">History:</strong>{" "}
                  <span className="text-slate-600">{r.history}</span>
                </p>
              ) : null}
              {r.examination ? (
                <p>
                  <strong className="text-slate-700">Physical Examination:</strong>{" "}
                  <span className="text-slate-600">{r.examination}</span>
                </p>
              ) : null}
            </div>

            {/* Prescriptions */}
            {r.prescription && r.prescription.length > 0 ? (
              <div className="mt-4 p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                <p className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-teal-700" />
                  <span>Prescribed Medication (Rx)</span>
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {r.prescription.map((rx, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded-lg border border-teal-200/60 text-xs"
                    >
                      <p className="font-bold text-slate-900">
                        {rx.medicineName} — <span className="text-teal-700">{rx.dosage}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {rx.frequency} · {rx.duration}
                      </p>
                      {rx.instructions ? (
                        <p className="text-[11px] text-slate-600 italic mt-0.5">
                          {rx.instructions}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Clinical Notes & Follow-up */}
            {r.notes ? (
              <div className="mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-700">Clinical Advice:</strong> {r.notes}
              </div>
            ) : null}

            {r.followUpDate ? (
              <p className="text-xs text-teal-800 font-bold mt-2">
                📅 Follow-up Advised: {r.followUpDate}
              </p>
            ) : null}
          </article>
        ))}

        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-slate-400 text-sm">
            No EHR clinical notes found. Click &ldquo;New Clinical Note & Rx&rdquo; to create a consultation record.
          </div>
        ) : null}
      </div>

      {/* New Consultation / Clinical Note Modal */}
      {openModal ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={createRecord}
            className="card p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FilePlus className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-lg text-slate-900">
                  New Clinical Consultation & Digital Rx
                </h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        {p.name} ({p.mrn}) · Age: {p.age} · Blood: {p.bloodGroup}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attending Consultant
                  </label>
                  <select
                    className="select"
                    value={form.doctorId}
                    onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  >
                    <option value="">-- Choose Doctor --</option>
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
                  Chief Complaint / Reason for Encounter <span className="text-red-600">*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. High fever x 3 days, body aches, retro-orbital pain"
                  value={form.chiefComplaint}
                  onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    History of Present Illness
                  </label>
                  <textarea
                    className="textarea text-xs"
                    rows={2}
                    placeholder="Onset, duration, progression, aggravating/relieving factors..."
                    value={form.history}
                    onChange={(e) => setForm({ ...form, history: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Physical Examination Findings
                  </label>
                  <textarea
                    className="textarea text-xs"
                    rows={2}
                    placeholder="General appearance, CVS, Chest, Abdomen, CNS, local exam..."
                    value={form.examination}
                    onChange={(e) => setForm({ ...form, examination: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clinical Diagnosis <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="input font-semibold"
                    placeholder="e.g. Suspected Dengue Fever with Thrombocytopenia"
                    value={form.diagnosis}
                    onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ICD-10 Code
                  </label>
                  <input
                    className="input font-mono"
                    placeholder="A90"
                    value={form.icdCode}
                    onChange={(e) => setForm({ ...form, icdCode: e.target.value })}
                  />
                </div>
              </div>

              {/* Consultation Vitals */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Consultation Vitals
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium">BP (mmHg)</label>
                    <input
                      className="input text-xs"
                      value={form.bp}
                      onChange={(e) => setForm({ ...form, bp: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium">Pulse (bpm)</label>
                    <input
                      className="input text-xs"
                      type="number"
                      value={form.pulse}
                      onChange={(e) => setForm({ ...form, pulse: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium">Temp (°F)</label>
                    <input
                      className="input text-xs"
                      type="number"
                      step="0.1"
                      value={form.temperature}
                      onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium">SpO2 (%)</label>
                    <input
                      className="input text-xs"
                      type="number"
                      value={form.spO2}
                      onChange={(e) => setForm({ ...form, spO2: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Prescription Builder */}
              <div className="p-3 bg-teal-50/40 rounded-xl border border-teal-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="h-4 w-4 text-teal-700" />
                    <span>Prescription Items (Rx)</span>
                  </span>
                  <button
                    type="button"
                    onClick={addPrescriptionItem}
                    className="btn btn-outline text-xs py-1 px-2.5 bg-white"
                  >
                    + Add Medication
                  </button>
                </div>

                <div className="space-y-2">
                  {form.prescription.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-4">
                        <input
                          className="input text-xs"
                          placeholder="Medicine name (e.g. Paracetamol 500mg)"
                          value={item.medicineName}
                          onChange={(e) => updateRxItem(idx, "medicineName", e.target.value)}
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          className="input text-xs"
                          placeholder="Dosage (500mg)"
                          value={item.dosage}
                          onChange={(e) => updateRxItem(idx, "dosage", e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          className="input text-xs"
                          placeholder="Frequency (TDS / BD / OD)"
                          value={item.frequency}
                          onChange={(e) => updateRxItem(idx, "frequency", e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          className="input text-xs"
                          placeholder="Duration (5 days)"
                          value={item.duration}
                          onChange={(e) => updateRxItem(idx, "duration", e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removePrescriptionItem(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Suggested Diagnostic Lab Orders (comma separated)
                </label>
                <input
                  className="input"
                  placeholder="e.g. CBC, Serum Electrolytes, Dengue NS1, Chest X-Ray"
                  value={form.labOrdersSuggested}
                  onChange={(e) => setForm({ ...form, labOrdersSuggested: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clinical Advice & Patient Instructions
                  </label>
                  <textarea
                    className="textarea text-xs"
                    rows={2}
                    placeholder="Dietary instructions, rest, fluid intake, emergency warnings..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={form.followUpDate}
                    onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  />
                </div>
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
                {loading ? "Saving..." : "Save Clinical Consultation"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
