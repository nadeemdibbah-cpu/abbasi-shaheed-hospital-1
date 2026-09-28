"use client";

import { AppShell, HospitalPrintHeader, PageTitle, StatusBadge } from "@/components/ui";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Activity,
  Bed,
  CheckCircle2,
  Clock,
  Filter,
  LogOut,
  Plus,
  Printer,
  Search,
  Shield,
  Stethoscope,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import type { Doctor, Patient, WardBed } from "@/lib/types";

type BedRow = WardBed & {
  patientName?: string;
  patientMrn?: string;
  patientGender?: string;
  patientAge?: number;
  doctorName?: string;
};

export default function WardsPage() {
  const [beds, setBeds] = useState<BedRow[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>("All");
  const [openModal, setOpenModal] = useState(false);
  const [selectedBedToAdmit, setSelectedBedToAdmit] = useState<BedRow | null>(null);
  const [loading, setLoading] = useState(false);

  const [admitForm, setAdmitForm] = useState({
    patientId: "",
    doctorId: "",
    notes: "Admitted for Inpatient Management",
  });

  function loadData() {
    fetch("/api/wards")
      .then((r) => r.json())
      .then(setBeds)
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

  async function admitPatient(e: FormEvent) {
    e.preventDefault();
    if (!selectedBedToAdmit) return;
    setLoading(true);
    const res = await fetch("/api/wards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bedId: selectedBedToAdmit.id,
        patientId: admitForm.patientId,
        doctorId: admitForm.doctorId,
        notes: admitForm.notes,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpenModal(false);
      setSelectedBedToAdmit(null);
      setAdmitForm({ patientId: "", doctorId: "", notes: "Admitted for Inpatient Management" });
      loadData();
    }
  }

  async function updateBedStatus(bedId: string, action: "discharge" | "available" | "cleaning" | "maintenance") {
    await fetch("/api/wards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bedId, action }),
    });
    loadData();
  }

  const wardNames = Array.from(new Set(beds.map((b) => b.wardName)));

  const filteredBeds = beds.filter((b) => {
    if (selectedWard === "All") return true;
    return b.wardName === selectedWard;
  });

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === "Occupied").length;
  const availableBeds = beds.filter((b) => b.status === "Available").length;
  const cleaningBeds = beds.filter((b) => b.status === "Cleaning" || b.status === "Maintenance").length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return (
    <AppShell>
      <PageTitle
        title="Ward & Inpatient Bed Management"
        subtitle="Visual bed layout, ICU / CCU capacity, inpatient admissions & discharges."
      >
        <button
          onClick={() => window.print()}
          className="btn btn-ghost text-xs flex items-center gap-1.5 no-print"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Bed Roster</span>
        </button>
      </PageTitle>

      <HospitalPrintHeader documentTitle="INPATIENT WARD & BED OCCUPANCY STATUS" />

      {/* Bed Occupancy Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 no-print">
        <div className="card p-4 border-l-4 border-l-teal-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bed Capacity</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalBeds}</p>
          <p className="text-xs text-teal-700 font-medium mt-0.5">ASH Inpatient Complex</p>
        </div>

        <div className="card p-4 border-l-4 border-l-rose-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Occupied Beds</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{occupiedBeds}</p>
          <p className="text-xs text-rose-600 font-medium mt-0.5">{occupancyRate}% Hospital Load</p>
        </div>

        <div className="card p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Beds</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{availableBeds}</p>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">Ready for Admission</p>
        </div>

        <div className="card p-4 border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sanitization / Maint</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{cleaningBeds}</p>
          <p className="text-xs text-amber-600 font-medium mt-0.5">Cleaning in progress</p>
        </div>
      </div>

      {/* Ward Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-print">
        <button
          onClick={() => setSelectedWard("All")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedWard === "All"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Wards ({totalBeds})
        </button>
        {wardNames.map((w) => (
          <button
            key={w}
            onClick={() => setSelectedWard(w)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedWard === w
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Visual Bed Grid Grouped by Ward */}
      <div className="space-y-6">
        {wardNames
          .filter((w) => selectedWard === "All" || selectedWard === w)
          .map((wardName) => {
            const wardBeds = beds.filter((b) => b.wardName === wardName);
            return (
              <div key={wardName} className="card p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-teal-700" />
                    <h3 className="font-bold text-slate-900 text-base">{wardName}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {wardBeds.filter((b) => b.status === "Occupied").length} / {wardBeds.length}{" "}
                    Occupied
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wardBeds.map((bed) => (
                    <div
                      key={bed.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        bed.status === "Occupied"
                          ? "bg-rose-50/40 border-rose-200"
                          : bed.status === "Available"
                          ? "bg-emerald-50/40 border-emerald-200"
                          : "bg-amber-50/40 border-amber-200"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                            {bed.bedNumber}
                          </span>
                          <span
                            className={`badge text-[11px] font-bold ${
                              bed.status === "Occupied"
                                ? "badge-red"
                                : bed.status === "Available"
                                ? "badge-green"
                                : "badge-amber"
                            }`}
                          >
                            {bed.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 font-semibold uppercase mt-2">
                          Type: {bed.type}
                        </p>

                        {bed.status === "Occupied" && bed.patientId ? (
                          <div className="mt-2.5 p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                            <Link
                              href={`/patients/${bed.patientId}`}
                              className="font-bold text-slate-900 hover:text-teal-700 block"
                            >
                              {bed.patientName}
                            </Link>
                            <p className="text-[11px] text-slate-500 font-mono">{bed.patientMrn}</p>
                            <p className="text-[11px] text-slate-600 mt-1">
                              Doctor: <strong>{bed.doctorName}</strong>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Admitted: {bed.admittedAt || "Recent"}
                            </p>
                          </div>
                        ) : null}

                        {bed.notes && bed.status !== "Occupied" ? (
                          <p className="text-[11px] text-slate-600 mt-2 italic bg-white p-2 rounded border border-slate-200">
                            {bed.notes}
                          </p>
                        ) : null}
                      </div>

                      {/* Action buttons on Bed card */}
                      <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2 no-print">
                        {bed.status === "Available" ? (
                          <button
                            onClick={() => {
                              setSelectedBedToAdmit(bed);
                              setOpenModal(true);
                            }}
                            className="btn btn-primary text-xs w-full py-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Admit Patient</span>
                          </button>
                        ) : null}

                        {bed.status === "Occupied" ? (
                          <button
                            onClick={() => updateBedStatus(bed.id, "discharge")}
                            className="btn btn-outline text-xs text-rose-700 border-rose-300 hover:bg-rose-50 w-full py-1.5"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            <span>Discharge</span>
                          </button>
                        ) : null}

                        {bed.status === "Cleaning" || bed.status === "Maintenance" ? (
                          <button
                            onClick={() => updateBedStatus(bed.id, "available")}
                            className="btn btn-primary text-xs bg-emerald-700 hover:bg-emerald-800 w-full py-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Mark Ready</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Inpatient Admission Modal */}
      {openModal && selectedBedToAdmit ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={admitPatient}
            className="card p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Admit Patient to Bed</h3>
                  <p className="text-xs text-teal-700 font-mono">
                    {selectedBedToAdmit.wardName} — {selectedBedToAdmit.bedNumber}
                  </p>
                </div>
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
                  Select Patient to Admit <span className="text-red-600">*</span>
                </label>
                <select
                  className="select"
                  value={admitForm.patientId}
                  onChange={(e) => setAdmitForm({ ...admitForm, patientId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Registered Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) · Blood: {p.bloodGroup} · Panel: {p.panelType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attending Consultant In-Charge
                </label>
                <select
                  className="select"
                  value={admitForm.doctorId}
                  onChange={(e) => setAdmitForm({ ...admitForm, doctorId: e.target.value })}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admission Diagnosis & Care Plan
                </label>
                <textarea
                  className="textarea text-xs"
                  rows={3}
                  placeholder="e.g. Post-Op monitoring, IV antibiotic regimen, telemetry monitoring..."
                  value={admitForm.notes}
                  onChange={(e) => setAdmitForm({ ...admitForm, notes: e.target.value })}
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
                {loading ? "Admitting..." : "Confirm Admission"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
