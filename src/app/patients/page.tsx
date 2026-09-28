"use client";

import { AppShell, HospitalPrintHeader, PageTitle, StatusBadge } from "@/components/ui";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  FileText,
  Filter,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { Patient } from "@/lib/types";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [panelFilter, setPanelFilter] = useState("All");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    gender: "Male" as "Male" | "Female" | "Other",
    age: "",
    dob: "",
    phone: "",
    cnic: "",
    guardianName: "",
    emergencyContact: "",
    address: "",
    bloodGroup: "B+",
    allergies: "None",
    chronicConditions: "None",
    panelType: "Sehat Sahulat" as Patient["panelType"],
    status: "Outpatient" as Patient["status"],
    bp: "120/80",
    pulse: 76,
    temperature: 98.6,
    spO2: 98,
  });

  function loadPatients() {
    fetch("/api/patients")
      .then((r) => r.json())
      .then(setPatients)
      .catch(() => {});
  }

  useEffect(() => {
    loadPatients();
  }, []);

  async function createPatient(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        gender: form.gender,
        age: Number(form.age),
        dob: form.dob,
        phone: form.phone,
        cnic: form.cnic,
        guardianName: form.guardianName,
        emergencyContact: form.emergencyContact,
        address: form.address,
        bloodGroup: form.bloodGroup,
        allergies: form.allergies,
        chronicConditions: form.chronicConditions,
        panelType: form.panelType,
        status: form.status,
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
        name: "",
        gender: "Male",
        age: "",
        dob: "",
        phone: "",
        cnic: "",
        guardianName: "",
        emergencyContact: "",
        address: "",
        bloodGroup: "B+",
        allergies: "None",
        chronicConditions: "None",
        panelType: "Sehat Sahulat",
        status: "Outpatient",
        bp: "120/80",
        pulse: 76,
        temperature: 98.6,
        spO2: 98,
      });
      loadPatients();
    }
  }

  const filtered = patients.filter((p) => {
    const matchQ = `${p.name} ${p.mrn} ${p.phone} ${p.cnic} ${p.address}`
      .toLowerCase()
      .includes(q.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    const matchPanel = panelFilter === "All" || p.panelType === panelFilter;
    return matchQ && matchStatus && matchPanel;
  });

  return (
    <AppShell>
      <PageTitle
        title="Patient Master Index & Registry"
        subtitle="Search, register, and manage electronic medical record numbers (MRNs)."
      >
        <button
          onClick={() => window.print()}
          className="btn btn-ghost text-xs flex items-center gap-1.5 no-print"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Registry</span>
        </button>
        <button
          onClick={() => setOpenModal(true)}
          className="btn btn-primary text-xs flex items-center gap-1.5 no-print"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>New Patient Registration</span>
        </button>
      </PageTitle>

      <HospitalPrintHeader documentTitle="CENTRAL PATIENT MASTER RECORD INDEX" />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9 text-xs"
            placeholder="Search by Patient Name, MRN (ASH-XXXXX), CNIC, or Phone..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <select
            className="select text-xs max-w-[160px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Outpatient">Outpatient</option>
            <option value="Admitted">Admitted</option>
            <option value="Emergency">Emergency</option>
            <option value="Discharged">Discharged</option>
          </select>

          <select
            className="select text-xs max-w-[170px]"
            value={panelFilter}
            onChange={(e) => setPanelFilter(e.target.value)}
          >
            <option value="All">All Panel / Tariffs</option>
            <option value="Sehat Sahulat">Sehat Sahulat Card</option>
            <option value="KMC Staff">KMC Staff</option>
            <option value="Private">Private / Self-pay</option>
            <option value="Indigent/Free">Indigent / Free OPD</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>MRN</th>
                <th>Patient Details</th>
                <th>CNIC & Contact</th>
                <th>Blood / Allergies</th>
                <th>Coverage Panel</th>
                <th>Status</th>
                <th className="no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      href={`/patients/${p.id}`}
                      className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-200 hover:bg-teal-100"
                    >
                      {p.mrn}
                    </Link>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      Reg: {p.registeredAt}
                    </div>
                  </td>

                  <td>
                    <Link
                      href={`/patients/${p.id}`}
                      className="font-bold text-slate-900 hover:text-teal-700 text-sm"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {p.gender}, {p.age} yrs
                      {p.guardianName ? ` · s/o ${p.guardianName}` : ""}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{p.address}</p>
                  </td>

                  <td>
                    <p className="font-mono text-xs text-slate-700 font-semibold">{p.phone}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      CNIC: {p.cnic || "Not recorded"}
                    </p>
                  </td>

                  <td>
                    <span className="badge badge-teal font-bold">{p.bloodGroup}</span>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-[140px] truncate">
                      {p.allergies !== "None" ? (
                        <span className="text-red-700 font-medium">⚠️ {p.allergies}</span>
                      ) : (
                        "No known allergies"
                      )}
                    </p>
                  </td>

                  <td>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        p.panelType === "Sehat Sahulat"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.panelType === "KMC Staff"
                          ? "bg-blue-100 text-blue-800"
                          : p.panelType === "Indigent/Free"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {p.panelType}
                    </span>
                  </td>

                  <td>
                    <StatusBadge value={p.status} />
                  </td>

                  <td className="no-print">
                    <Link
                      href={`/patients/${p.id}`}
                      className="btn btn-ghost text-xs py-1 px-2.5 flex items-center gap-1 text-teal-700"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Chart</span>
                    </Link>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                    No patient records found matching your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Registration Modal */}
      {openModal ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={createPatient}
            className="card p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-lg text-slate-900">
                  New Patient Registration (MRN Generation)
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
              {/* Basic Demographics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Muhammad Bilal"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    className="select"
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value as "Male" | "Female" | "Other" })
                    }
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Age (Years) <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="input"
                    type="number"
                    placeholder="42"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    className="select"
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="input font-mono"
                    placeholder="0300-1234567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pakistani CNIC (National ID)
                  </label>
                  <input
                    className="input font-mono"
                    placeholder="42101-1234567-1"
                    value={form.cnic}
                    onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Father / Guardian / Spouse Name
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Abdul Rasheed (Father)"
                    value={form.guardianName}
                    onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Health Coverage / Panel
                  </label>
                  <select
                    className="select"
                    value={form.panelType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        panelType: e.target.value as Patient["panelType"],
                      })
                    }
                  >
                    <option value="Sehat Sahulat">Sehat Sahulat Health Card (Govt)</option>
                    <option value="KMC Staff">KMC Staff / Employee Welfare</option>
                    <option value="Private">Private / Self-pay</option>
                    <option value="Indigent/Free">Indigent / Free OPD Welfare</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Emergency Contact Number
                  </label>
                  <input
                    className="input font-mono"
                    placeholder="0321-9988776"
                    value={form.emergencyContact}
                    onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Residential Address (Karachi)
                </label>
                <input
                  className="input"
                  placeholder="e.g. Block H, North Nazimabad, Karachi"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Known Drug Allergies
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Penicillin, Sulfa drugs, Aspirin, None"
                    value={form.allergies}
                    onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chronic Medical Conditions
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Hypertension, Diabetes, Asthma, None"
                    value={form.chronicConditions}
                    onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })}
                  />
                </div>
              </div>

              {/* Initial Intake Vitals */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Registration Intake Vitals
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
                {loading ? "Registering..." : "Generate MRN & Save Patient"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
