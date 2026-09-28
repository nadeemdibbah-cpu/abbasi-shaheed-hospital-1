"use client";

import { AppShell, HospitalPrintHeader, PageTitle, StatusBadge } from "@/components/ui";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Megaphone,
  Plus,
  Printer,
  Search,
  Stethoscope,
  Users,
} from "lucide-react";
import type { Appointment, Doctor, Patient } from "@/lib/types";

type Row = Appointment & {
  patientName: string;
  patientMrn: string;
  patientPhone: string;
  doctorName: string;
  doctorDepartment: string;
  doctorRoom: string;
};

export default function AppointmentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedDoctor, setSelectedDoctor] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [openModal, setOpenModal] = useState(false);
  const [printingToken, setPrintingToken] = useState<Row | null>(null);
  const [callingToken, setCallingToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    date: new Date().toISOString().slice(0, 10),
    time: "09:30 AM",
    reason: "",
    priority: "Normal" as Appointment["priority"],
    notes: "",
  });

  function loadAppointments() {
    let url = `/api/appointments?date=${selectedDate}`;
    if (selectedDoctor !== "All") url += `&doctorId=${selectedDoctor}`;
    if (selectedStatus !== "All") url += `&status=${selectedStatus}`;

    fetch(url)
      .then((r) => r.json())
      .then(setRows)
      .catch(() => {});
  }

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, selectedDoctor, selectedStatus]);

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then(setPatients)
      .catch(() => {});
    fetch("/api/doctors")
      .then((r) => r.json())
      .then(setDoctors)
      .catch(() => {});
  }, []);

  async function createAppointment(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const selectedDoc = doctors.find((d) => d.id === form.doctorId);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: form.patientId,
        doctorId: form.doctorId,
        department: selectedDoc?.department || "General OPD",
        date: form.date,
        time: form.time,
        reason: form.reason,
        priority: form.priority,
        notes: form.notes,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpenModal(false);
      setForm({
        patientId: "",
        doctorId: "",
        date: new Date().toISOString().slice(0, 10),
        time: "09:30 AM",
        reason: "",
        priority: "Normal",
        notes: "",
      });
      loadAppointments();
    }
  }

  async function updateStatus(id: string, status: Appointment["status"]) {
    await fetch("/api/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadAppointments();
  }

  function callPatient(tokenNo: string) {
    setCallingToken(tokenNo);
    setTimeout(() => {
      setCallingToken(null);
    }, 4000);
  }

  return (
    <AppShell>
      <PageTitle
        title="Central OPD Token & Clinic Flow"
        subtitle="Live patient queuing, token calling, and consultant clinic schedules."
      >
        <button
          onClick={() => window.print()}
          className="btn btn-ghost text-xs flex items-center gap-1.5 no-print"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print OPD Schedule</span>
        </button>
        <button
          onClick={() => setOpenModal(true)}
          className="btn btn-primary text-xs flex items-center gap-1.5 no-print"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Issue OPD Token</span>
        </button>
      </PageTitle>

      <HospitalPrintHeader
        documentTitle="OUTPATIENT CLINIC (OPD) TOKEN ROSTER"
        date={selectedDate}
      />

      {/* Calling Audio/Visual Ticker (Mock PA announcement) */}
      {callingToken ? (
        <div className="card p-4 mb-4 bg-teal-900 text-white border-teal-700 flex items-center justify-between animate-bounce no-print">
          <div className="flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-[#eab308]" />
            <div>
              <p className="text-xs uppercase tracking-widest text-teal-200">Central OPD PA System</p>
              <p className="text-lg font-bold">
                Calling Token <span className="font-mono text-[#eab308]">{callingToken}</span> to Clinic Counter!
              </p>
            </div>
          </div>
          <span className="text-xs text-teal-200">Broadcasting to waiting hall...</span>
        </div>
      ) : null}

      {/* Date and Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 no-print">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Select OPD Date</label>
          <input
            type="date"
            className="input text-xs"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Consultant</label>
          <select
            className="select text-xs"
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
          >
            <option value="All">All Doctors & Clinics</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.department})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Filter</label>
          <select
            className="select text-xs"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Tokens</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Checked-in">Checked-in</option>
            <option value="In-Consultation">In-Consultation</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().slice(0, 10));
              setSelectedDoctor("All");
              setSelectedStatus("All");
            }}
            className="btn btn-ghost text-xs w-full"
          >
            Reset to Today
          </button>
        </div>
      </div>

      {/* Appointments & Token Queue Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Token #</th>
                <th>Patient Details</th>
                <th>Consultant / Clinic Room</th>
                <th>Reason & Priority</th>
                <th>Status</th>
                <th className="no-print">Queue Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className={a.status === "In-Consultation" ? "bg-purple-50/40" : ""}>
                  <td>
                    <span className="font-mono text-xs font-bold text-teal-900 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                      {a.tokenNo || "OPD-001"}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{a.time}</span>
                    </div>
                  </td>

                  <td>
                    <Link
                      href={`/patients/${a.patientId}`}
                      className="font-bold text-slate-900 hover:text-teal-700 text-sm"
                    >
                      {a.patientName}
                    </Link>
                    <p className="text-xs text-slate-500 font-mono">{a.patientMrn}</p>
                    <p className="text-[11px] text-slate-400">{a.patientPhone}</p>
                  </td>

                  <td>
                    <p className="font-medium text-slate-800 text-xs">{a.doctorName}</p>
                    <p className="text-[11px] text-teal-700 font-semibold">{a.doctorDepartment}</p>
                    <p className="text-[11px] text-slate-500">{a.doctorRoom || "OPD Clinic"}</p>
                  </td>

                  <td>
                    <p className="text-xs text-slate-800 font-medium">{a.reason}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block ${
                        a.priority === "Emergency"
                          ? "bg-red-100 text-red-800"
                          : a.priority === "Urgent"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {a.priority || "Normal"}
                    </span>
                  </td>

                  <td>
                    <StatusBadge value={a.status} />
                  </td>

                  <td className="no-print whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => callPatient(a.tokenNo)}
                        title="Call patient token over PA"
                        className="btn btn-ghost text-[11px] py-1 px-2 text-teal-700"
                      >
                        <Megaphone className="h-3 w-3" />
                        <span>Call</span>
                      </button>

                      {a.status === "Scheduled" ? (
                        <button
                          onClick={() => updateStatus(a.id, "Checked-in")}
                          className="btn btn-primary text-[11px] py-1 px-2"
                        >
                          Check in
                        </button>
                      ) : null}

                      {a.status === "Checked-in" ? (
                        <button
                          onClick={() => updateStatus(a.id, "In-Consultation")}
                          className="btn btn-primary text-[11px] py-1 px-2 bg-purple-700 hover:bg-purple-800"
                        >
                          Consult
                        </button>
                      ) : null}

                      {a.status === "In-Consultation" ? (
                        <button
                          onClick={() => updateStatus(a.id, "Completed")}
                          className="btn btn-primary text-[11px] py-1 px-2 bg-emerald-700 hover:bg-emerald-800"
                        >
                          Done
                        </button>
                      ) : null}

                      {a.status !== "Completed" && a.status !== "Cancelled" ? (
                        <button
                          onClick={() => updateStatus(a.id, "Cancelled")}
                          className="text-red-600 hover:underline text-xs p-1"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                    No OPD tokens found for {selectedDate}. Click &ldquo;Issue OPD Token&rdquo; to schedule.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book OPD Token Modal */}
      {openModal ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={createAppointment}
            className="card p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-lg text-slate-900">Issue Central OPD Token</h3>
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
                  <option value="">-- Choose Registered Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) · Phone: {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Consultant & Department <span className="text-red-600">*</span>
                </label>
                <select
                  className="select"
                  value={form.doctorId}
                  onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Doctor / Clinic --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.department} ({d.timing}) [Fee: Rs {d.fee}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">OPD Date</label>
                  <input
                    type="date"
                    className="input"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot</label>
                  <input
                    className="input"
                    placeholder="09:30 AM"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    className="select"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value as Appointment["priority"] })
                    }
                  >
                    <option value="Normal">Normal OPD</option>
                    <option value="Urgent">Urgent / Fast Track</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason for Visit / Complaint
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Hypertension Follow-up, Fever, Pain"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Referral Details</label>
                <textarea
                  className="textarea text-xs"
                  rows={2}
                  placeholder="e.g. Referred from Emergency / Bring previous lab reports"
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
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Generating..." : "Generate OPD Token"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
