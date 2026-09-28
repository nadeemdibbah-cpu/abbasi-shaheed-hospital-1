"use client";

import { AppShell, HospitalPrintHeader, PageTitle } from "@/components/ui";
import { FormEvent, useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Phone,
  Plus,
  Printer,
  Search,
  Shield,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import type { Doctor } from "@/lib/types";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    specialty: "",
    department: "Internal Medicine",
    qualification: "MBBS, FCPS",
    pmdcReg: "",
    roomNo: "OPD Clinic #05",
    phone: "021-99260300",
    email: "doctor@ash.org.pk",
    days: "Mon, Tue, Wed, Thu, Fri, Sat",
    timing: "08:30 AM – 02:00 PM",
    fee: 200,
    maxDailyTokens: 40,
    status: "Available" as Doctor["status"],
  });

  function loadDoctors() {
    fetch("/api/doctors")
      .then((r) => r.json())
      .then(setDoctors)
      .catch(() => {});
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  async function createDoctor(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        fee: Number(form.fee),
        maxDailyTokens: Number(form.maxDailyTokens),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpenModal(false);
      setForm({
        name: "",
        specialty: "",
        department: "Internal Medicine",
        qualification: "MBBS, FCPS",
        pmdcReg: "",
        roomNo: "OPD Clinic #05",
        phone: "021-99260300",
        email: "doctor@ash.org.pk",
        days: "Mon, Tue, Wed, Thu, Fri, Sat",
        timing: "08:30 AM – 02:00 PM",
        fee: 200,
        maxDailyTokens: 40,
        status: "Available",
      });
      loadDoctors();
    }
  }

  async function updateStatus(id: string, status: Doctor["status"]) {
    await fetch("/api/doctors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadDoctors();
  }

  const departments = Array.from(new Set(doctors.map((d) => d.department)));

  const filtered = doctors.filter((d) => {
    const matchQ = `${d.name} ${d.specialty} ${d.department} ${d.pmdcReg}`
      .toLowerCase()
      .includes(q.toLowerCase());
    const matchDept = selectedDept === "All" || d.department === selectedDept;
    return matchQ && matchDept;
  });

  return (
    <AppShell>
      <PageTitle
        title="Consultant Faculty & OPD Rosters"
        subtitle="Medical faculty of Karachi Medical & Dental College & Abbasi Shaheed Hospital."
      >
        <button
          onClick={() => window.print()}
          className="btn btn-ghost text-xs flex items-center gap-1.5 no-print"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Roster</span>
        </button>
        <button
          onClick={() => setOpenModal(true)}
          className="btn btn-primary text-xs flex items-center gap-1.5 no-print"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Consultant</span>
        </button>
      </PageTitle>

      <HospitalPrintHeader documentTitle="CONSULTANT MEDICAL ROSTER & OPD TIMINGS" />

      {/* Search & Department Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9 text-xs"
            placeholder="Search by Doctor Name, Specialty, or PMDC Number..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <select
          className="select text-xs max-w-[200px]"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        >
          <option value="All">All Departments ({doctors.length})</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((d) => (
          <div
            key={d.id}
            className="card p-5 flex flex-col justify-between hover:shadow-md transition-all border-t-4 border-t-teal-600"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {d.department}
                </span>

                <select
                  className={`text-[11px] font-bold py-0.5 px-2 rounded border outline-none no-print ${
                    d.status === "Available"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : d.status === "In OPD"
                      ? "bg-blue-50 text-blue-800 border-blue-300"
                      : d.status === "In Surgery"
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-slate-100 text-slate-600 border-slate-300"
                  }`}
                  value={d.status}
                  onChange={(e) => updateStatus(d.id, e.target.value as Doctor["status"])}
                >
                  <option value="Available">🟢 Available</option>
                  <option value="In OPD">🔵 In OPD Clinic</option>
                  <option value="In Surgery">🟡 In OT / Surgery</option>
                  <option value="On Leave">⚪ On Leave</option>
                </select>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-2">{d.name}</h3>
              <p className="text-xs text-slate-600 font-medium">{d.specialty}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{d.qualification}</p>

              <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span>{d.roomNo || "Central OPD Clinic"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span>{d.days}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span>{d.timing}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span className="font-mono text-[11px] font-semibold">{d.pmdcReg}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Fee: <strong className="text-slate-800">Rs {d.fee}</strong> (KMC Tariff)
              </span>
              <span className="text-slate-500">
                Max: <strong className="text-slate-800">{d.maxDailyTokens}</strong> tokens/day
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 ? (
          <div className="col-span-full card p-8 text-center text-slate-400 text-sm">
            No doctors found matching your search.
          </div>
        ) : null}
      </div>

      {/* Add Consultant Modal */}
      {openModal ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={createDoctor}
            className="card p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-lg text-slate-900">Add Consultant to Faculty</h3>
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
                  Doctor Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. Prof. Dr. Tariq Mehmood"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    className="select"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  >
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="General Surgery">General Surgery</option>
                    <option value="Gynae & Obs">Gynae & Obs</option>
                    <option value="Orthopedics & Trauma">Orthopedics & Trauma</option>
                    <option value="Pediatrics & Neonatology">Pediatrics & Neonatology</option>
                    <option value="Cardiology & CCU">Cardiology & CCU</option>
                    <option value="Emergency Medicine">Emergency Medicine</option>
                    <option value="Ophthalmology / Eye">Ophthalmology / Eye</option>
                    <option value="ENT / Otorhinolaryngology">ENT</option>
                    <option value="Dermatology">Dermatology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation / Specialty
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Consultant Orthopedic Surgeon"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Qualifications
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. MBBS, FCPS, FRCS"
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PMDC / PMC Registration
                  </label>
                  <input
                    className="input font-mono"
                    placeholder="PMC-14502-S"
                    value={form.pmdcReg}
                    onChange={(e) => setForm({ ...form, pmdcReg: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">OPD Clinic Room</label>
                  <input
                    className="input"
                    placeholder="OPD Clinic #08 (Ground Floor)"
                    value={form.roomNo}
                    onChange={(e) => setForm({ ...form, roomNo: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone / Ext</label>
                  <input
                    className="input font-mono"
                    placeholder="021-99260403"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">OPD Days</label>
                  <input
                    className="input"
                    placeholder="Mon, Tue, Thu, Fri"
                    value={form.days}
                    onChange={(e) => setForm({ ...form, days: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">OPD Timings</label>
                  <input
                    className="input"
                    placeholder="09:00 AM – 02:00 PM"
                    value={form.timing}
                    onChange={(e) => setForm({ ...form, timing: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    OPD Slip Fee (PKR)
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Daily Tokens
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={form.maxDailyTokens}
                    onChange={(e) => setForm({ ...form, maxDailyTokens: Number(e.target.value) })}
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
                {loading ? "Saving..." : "Save Consultant"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
