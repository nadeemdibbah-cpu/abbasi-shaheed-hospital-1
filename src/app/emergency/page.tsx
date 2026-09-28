"use client";

import { AppShell, HospitalPrintHeader, PageTitle, StatusBadge } from "@/components/ui";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Bed,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  HeartPulse,
  Plus,
  Printer,
  Search,
  ShieldAlert,
  Stethoscope,
  Users,
} from "lucide-react";
import type { Doctor, EmergencyPatient, Patient } from "@/lib/types";

type ERRow = EmergencyPatient & {
  patientName: string;
  patientMrn: string;
  patientAge: number;
  patientGender: string;
  patientBloodGroup: string;
  doctorName: string;
};

export default function EmergencyPage() {
  const [cases, setCases] = useState<ERRow[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedTriage, setSelectedTriage] = useState<string>("All");
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    patientId: "",
    triageLevel: "Yellow" as "Red" | "Yellow" | "Green",
    bedNumber: "ER-Bay-01",
    chiefComplaint: "",
    attendingDoctorId: "",
    notes: "",
    bp: "120/80",
    pulse: 84,
    temperature: 98.6,
    spO2: 98,
    respiratoryRate: 18,
  });

  function loadData() {
    fetch("/api/emergency")
      .then((r) => r.json())
      .then(setCases)
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

  async function createTriage(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/emergency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: form.patientId,
        triageLevel: form.triageLevel,
        bedNumber: form.bedNumber,
        chiefComplaint: form.chiefComplaint,
        attendingDoctorId: form.attendingDoctorId,
        notes: form.notes,
        vitals: {
          bp: form.bp,
          pulse: Number(form.pulse),
          temperature: Number(form.temperature),
          spO2: Number(form.spO2),
          respiratoryRate: Number(form.respiratoryRate),
          recordedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        },
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpenModal(false);
      setForm({
        patientId: "",
        triageLevel: "Yellow",
        bedNumber: "ER-Bay-01",
        chiefComplaint: "",
        attendingDoctorId: "",
        notes: "",
        bp: "120/80",
        pulse: 84,
        temperature: 98.6,
        spO2: 98,
        respiratoryRate: 18,
      });
      loadData();
    }
  }

  async function updateStatus(id: string, status: EmergencyPatient["status"]) {
    await fetch("/api/emergency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadData();
  }

  async function updateTriageLevel(id: string, triageLevel: EmergencyPatient["triageLevel"]) {
    await fetch("/api/emergency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, triageLevel }),
    });
    loadData();
  }

  const filtered = cases.filter((c) => {
    if (selectedTriage === "All") return true;
    if (selectedTriage === "Active") return c.status === "Triage" || c.status === "Treatment";
    if (selectedTriage === "Red" || selectedTriage === "Yellow" || selectedTriage === "Green") {
      return c.triageLevel === selectedTriage;
    }
    return c.status === selectedTriage;
  });

  const redCount = cases.filter((c) => c.triageLevel === "Red" && (c.status === "Triage" || c.status === "Treatment")).length;
  const yellowCount = cases.filter((c) => c.triageLevel === "Yellow" && (c.status === "Triage" || c.status === "Treatment")).length;
  const greenCount = cases.filter((c) => c.triageLevel === "Green" && (c.status === "Triage" || c.status === "Treatment")).length;

  return (
    <AppShell>
      <PageTitle
        title="24/7 Emergency & Trauma Triage"
        subtitle="North Nazimabad Emergency Department & Resuscitation Center"
      >
        <button
          onClick={() => window.print()}
          className="btn btn-ghost text-xs flex items-center gap-1.5"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Triage Sheet</span>
        </button>
        <button
          onClick={() => setOpenModal(true)}
          className="btn btn-danger text-xs flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>STAT Triage Admission</span>
        </button>
      </PageTitle>

      <HospitalPrintHeader documentTitle="24/7 EMERGENCY TRIAGE & TRAUMA LOG" />

      {/* Triage Level Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 no-print">
        {/* Red: Immediate */}
        <div
          onClick={() => setSelectedTriage("Red")}
          className={`card p-4.5 cursor-pointer border-l-4 border-l-red-600 transition-all ${
            selectedTriage === "Red" ? "ring-2 ring-red-500 bg-red-50/40" : "hover:border-red-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-600 animate-ping"></span>
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
                Category 1: Resuscitation (Red)
              </span>
            </div>
            <Flame className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{redCount}</p>
          <p className="text-xs text-slate-500 mt-1">Immediate life threat (Dengue shock, MI, Trauma)</p>
        </div>

        {/* Yellow: Urgent */}
        <div
          onClick={() => setSelectedTriage("Yellow")}
          className={`card p-4.5 cursor-pointer border-l-4 border-l-amber-500 transition-all ${
            selectedTriage === "Yellow" ? "ring-2 ring-amber-500 bg-amber-50/40" : "hover:border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Category 2: Urgent (Yellow)
            </span>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{yellowCount}</p>
          <p className="text-xs text-slate-500 mt-1">Severe illness within 30-60 mins review</p>
        </div>

        {/* Green: Stable */}
        <div
          onClick={() => setSelectedTriage("Green")}
          className={`card p-4.5 cursor-pointer border-l-4 border-l-emerald-600 transition-all ${
            selectedTriage === "Green" ? "ring-2 ring-emerald-500 bg-emerald-50/40" : "hover:border-emerald-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Category 3: Non-Urgent (Green)
            </span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{greenCount}</p>
          <p className="text-xs text-slate-500 mt-1">Stable ambulatory patients</p>
        </div>
      </div>

      {/* Triage Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 no-print">
        {["All", "Active", "Red", "Yellow", "Green", "Admitted", "Discharged"].map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTriage(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedTriage === t
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {t} Cases
          </button>
        ))}
      </div>

      {/* Emergency Cases List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Triage / Bed</th>
                <th>Patient Details</th>
                <th>Chief Complaint & Notes</th>
                <th>Vitals at Triage</th>
                <th>Attending Doctor</th>
                <th>Status</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className={c.triageLevel === "Red" ? "bg-red-50/30" : ""}>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                          c.triageLevel === "Red"
                            ? "bg-red-600 text-white animate-pulse"
                            : c.triageLevel === "Yellow"
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {c.triageLevel}
                      </span>
                    </div>
                    <p className="font-mono text-xs font-bold text-slate-800 mt-1.5 bg-slate-100 px-2 py-0.5 rounded inline-block">
                      {c.bedNumber}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">{c.arrivalTime}</p>
                  </td>

                  <td>
                    <Link
                      href={`/patients/${c.patientId}`}
                      className="font-bold text-teal-800 hover:underline text-sm"
                    >
                      {c.patientName}
                    </Link>
                    <p className="text-xs text-slate-500 font-mono">{c.patientMrn}</p>
                    <p className="text-xs text-slate-600">
                      {c.patientGender}, {c.patientAge} yrs · Blood: <strong>{c.patientBloodGroup}</strong>
                    </p>
                  </td>

                  <td className="max-w-xs">
                    <p className="font-semibold text-slate-900 text-xs">{c.chiefComplaint}</p>
                    {c.notes ? <p className="text-[11px] text-slate-600 mt-1">{c.notes}</p> : null}
                  </td>

                  <td>
                    {c.vitals ? (
                      <div className="text-xs space-y-0.5 font-mono">
                        <p>
                          BP: <strong>{c.vitals.bp}</strong>
                        </p>
                        <p>
                          Pulse: <strong>{c.vitals.pulse} bpm</strong>
                        </p>
                        <p>
                          Temp:{" "}
                          <strong className={c.vitals.temperature > 100 ? "text-red-700" : ""}>
                            {c.vitals.temperature}°F
                          </strong>
                        </p>
                        <p>
                          SpO2:{" "}
                          <strong className={c.vitals.spO2 < 95 ? "text-red-700" : ""}>
                            {c.vitals.spO2}%
                          </strong>
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>

                  <td>
                    <p className="text-xs font-medium text-slate-800">{c.doctorName}</p>
                    <p className="text-[11px] text-teal-700">Emergency & Trauma</p>
                  </td>

                  <td>
                    <StatusBadge value={c.status} />
                  </td>

                  <td className="no-print whitespace-nowrap">
                    <div className="flex flex-col gap-1.5 text-xs">
                      {c.status !== "Discharged" && c.status !== "Admitted" ? (
                        <>
                          <button
                            onClick={() => updateStatus(c.id, "Admitted")}
                            className="text-teal-700 hover:underline text-left font-semibold"
                          >
                            + Admit to Ward
                          </button>
                          <button
                            onClick={() => updateStatus(c.id, "Discharged")}
                            className="text-slate-600 hover:underline text-left"
                          >
                            Discharge Patient
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Completed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                    No emergency cases found for this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* STAT Triage Modal */}
      {openModal ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={createTriage}
            className="card p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-red-600" />
                <h3 className="font-bold text-lg text-slate-900">STAT Emergency Triage Intake</h3>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Patient</label>
                <select
                  className="select"
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Registered Patient (or Register in Patients tab) --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) · CNIC: {p.cnic || "N/A"} · Blood: {p.bloodGroup}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Triage Priority</label>
                  <select
                    className="select font-bold"
                    value={form.triageLevel}
                    onChange={(e) =>
                      setForm({ ...form, triageLevel: e.target.value as "Red" | "Yellow" | "Green" })
                    }
                  >
                    <option value="Red">🔴 Red (Immediate / Resuscitation)</option>
                    <option value="Yellow">🟡 Yellow (Urgent)</option>
                    <option value="Green">🟢 Green (Stable / Non-urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ER Bed / Bay</label>
                  <input
                    className="input font-mono"
                    value={form.bedNumber}
                    onChange={(e) => setForm({ ...form, bedNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">ER Doctor</label>
                  <select
                    className="select"
                    value={form.attendingDoctorId}
                    onChange={(e) => setForm({ ...form, attendingDoctorId: e.target.value })}
                  >
                    <option value="">On-duty ER Medical Officer</option>
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
                  Chief Complaint / Primary Emergency Presentation
                </label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="e.g. Severe retro-orbital pain, bleeding gums, platelet drop (Dengue), severe dyspnea, acute chest pain..."
                  value={form.chiefComplaint}
                  onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                  required
                />
              </div>

              {/* Triage Vitals */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Triage Vitals Check
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium">BP (mmHg)</label>
                    <input
                      className="input text-xs"
                      placeholder="120/80"
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
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium">Resp Rate</label>
                    <input
                      className="input text-xs"
                      type="number"
                      value={form.respiratoryRate}
                      onChange={(e) => setForm({ ...form, respiratoryRate: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Immediate Emergency Orders & Interventions
                </label>
                <textarea
                  className="textarea text-xs"
                  rows={2}
                  placeholder="e.g. 18G IV Cannula secured, Ringer Lactate 100ml/hr, STAT CBC + NS1 Dengue..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
              <button type="submit" className="btn btn-danger" disabled={loading}>
                {loading ? "Admitting..." : "Admit to Emergency"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
