"use client";

import { AppShell, PageTitle, StatusBadge } from "@/components/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  Bed,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  HeartPulse,
  Pill,
  Plus,
  RefreshCw,
  Stethoscope,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

type Dash = {
  stats: {
    patients: number;
    doctors: number;
    todayAppointments: number;
    emergencyActive: number;
    totalBeds: number;
    occupiedBeds: number;
    bedOccupancyRate: number;
    unpaidBills: number;
    lowStock: number;
    pendingLabs: number;
    totalRevenue: number;
    pendingRevenue: number;
  };
  todayAppointments: Array<{
    id: string;
    tokenNo: string;
    time: string;
    department: string;
    reason: string;
    status: string;
    priority: string;
    patientName: string;
    doctorName: string;
  }>;
  recentPatients: Array<{
    id: string;
    mrn: string;
    name: string;
    age: number;
    gender: string;
    registeredAt: string;
    bloodGroup: string;
  }>;
  emergencyQueue: Array<{
    id: string;
    patientId: string;
    patientName: string;
    triageLevel: "Red" | "Yellow" | "Green";
    bedNumber: string;
    chiefComplaint: string;
    arrivalTime: string;
    status: string;
    doctorName: string;
  }>;
  lowStock: Array<{
    id: string;
    name: string;
    stock: number;
    minStock: number;
    unit: string;
  }>;
  unpaidInvoices: Array<{
    id: string;
    invoiceNo?: string;
    patientName: string;
    total: number;
    status: string;
    date: string;
  }>;
  wardSummary: {
    total: number;
    occupied: number;
    available: number;
    cleaning: number;
  };
};

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);

  function loadDashboard() {
    setLoading(true);
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <AppShell>
      {/* Dashboard Header with Quick Actions */}
      <PageTitle
        title="Hospital Operations Command Center"
        subtitle="Real-time clinical, triage, inpatient, and financial overview."
      >
        <button
          onClick={loadDashboard}
          className="btn btn-ghost text-xs flex items-center gap-1.5"
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
          <span>Refresh Live</span>
        </button>
        <Link href="/emergency" className="btn btn-danger text-xs flex items-center gap-1.5">
          <HeartPulse className="h-3.5 w-3.5" />
          <span>ER Triage</span>
        </Link>
        <Link href="/patients" className="btn btn-primary text-xs flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          <span>Register Patient</span>
        </Link>
      </PageTitle>

      {/* Main Metric Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Metric 1: Emergency & Trauma */}
        <Link
          href="/emergency"
          className="card card-hover p-4.5 border-l-4 border-l-red-500 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ER Trauma Active
            </span>
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <HeartPulse className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {data?.stats.emergencyActive ?? 0}{" "}
              <span className="text-xs font-normal text-slate-500">cases</span>
            </p>
            <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping"></span>
              24/7 STAT Resuscitation
            </p>
          </div>
        </Link>

        {/* Metric 2: Today's OPD Tokens */}
        <Link
          href="/appointments"
          className="card card-hover p-4.5 border-l-4 border-l-teal-600 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today OPD Tokens
            </span>
            <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {data?.stats.todayAppointments ?? 0}
            </p>
            <p className="text-xs text-teal-700 font-medium mt-1">
              {data?.stats.doctors ?? 0} Consultants in clinic
            </p>
          </div>
        </Link>

        {/* Metric 3: Bed Occupancy */}
        <Link
          href="/wards"
          className="card card-hover p-4.5 border-l-4 border-l-amber-500 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Bed Occupancy
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bed className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {data?.stats.bedOccupancyRate ?? 0}%
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {data?.stats.occupiedBeds ?? 0} / {data?.stats.totalBeds ?? 0} beds occupied
            </p>
          </div>
        </Link>

        {/* Metric 4: Total Patients */}
        <Link
          href="/patients"
          className="card card-hover p-4.5 border-l-4 border-l-blue-600 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Registered Patients
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">{data?.stats.patients ?? 0}</p>
            <p className="text-xs text-blue-700 font-medium mt-1">Central MRN Database</p>
          </div>
        </Link>
      </div>

      {/* Secondary Alerts & Mini Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link
          href="/lab"
          className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:border-teal-500 transition-colors"
        >
          <div>
            <p className="text-xs text-slate-500">Pending Lab Tests</p>
            <p className="text-lg font-bold text-slate-800">{data?.stats.pendingLabs ?? 0}</p>
          </div>
          <FlaskConical className="h-5 w-5 text-indigo-500" />
        </Link>

        <Link
          href="/pharmacy"
          className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:border-teal-500 transition-colors"
        >
          <div>
            <p className="text-xs text-slate-500">Low Stock Meds</p>
            <p className="text-lg font-bold text-amber-700">{data?.stats.lowStock ?? 0}</p>
          </div>
          <Pill className="h-5 w-5 text-amber-500" />
        </Link>

        <Link
          href="/billing"
          className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:border-teal-500 transition-colors"
        >
          <div>
            <p className="text-xs text-slate-500">Unpaid Invoices</p>
            <p className="text-lg font-bold text-rose-700">{data?.stats.unpaidBills ?? 0}</p>
          </div>
          <CreditCard className="h-5 w-5 text-rose-500" />
        </Link>

        <Link
          href="/billing"
          className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:border-teal-500 transition-colors"
        >
          <div>
            <p className="text-xs text-slate-500">Today Collected</p>
            <p className="text-lg font-bold text-emerald-700">
              Rs {(data?.stats.totalRevenue ?? 0).toLocaleString()}
            </p>
          </div>
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </Link>
      </div>

      {/* Main Two-Column Operational Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on large screen): Live OPD Queue + Active ER */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Emergency Trauma Box */}
          {data?.emergencyQueue && data.emergencyQueue.length > 0 ? (
            <div className="card p-5 border-l-4 border-l-red-600 bg-gradient-to-r from-red-50/40 to-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping"></span>
                  <h3 className="font-bold text-slate-900 text-base">
                    Active Emergency & Trauma Cases
                  </h3>
                </div>
                <Link
                  href="/emergency"
                  className="text-xs font-semibold text-red-700 hover:underline flex items-center gap-1"
                >
                  <span>Open Triage Board</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {data.emergencyQueue.map((er) => (
                  <div
                    key={er.id}
                    className="p-3 bg-white rounded-xl border border-red-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          er.triageLevel === "Red"
                            ? "bg-red-600 text-white"
                            : er.triageLevel === "Yellow"
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {er.triageLevel} Triage
                      </span>
                      <div>
                        <Link
                          href={`/patients/${er.patientId}`}
                          className="font-bold text-slate-900 hover:text-teal-700 text-sm"
                        >
                          {er.patientName}
                        </Link>
                        <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                          {er.chiefComplaint}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 self-end sm:self-center">
                      <span className="font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {er.bedNumber}
                      </span>
                      <span>{er.arrivalTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Today's OPD Appointments & Clinic Flow */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Today&apos;s OPD Token Queue</h3>
                <p className="text-xs text-slate-500">Live patient calling & consultation progress</p>
              </div>
              <Link
                href="/appointments"
                className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
              >
                <span>Full OPD Schedule</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Patient</th>
                    <th>Doctor & Dept</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.todayAppointments && data.todayAppointments.length > 0 ? (
                    data.todayAppointments.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200">
                            {a.tokenNo || "OPD-001"}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-1">{a.time}</div>
                        </td>
                        <td>
                          <p className="font-semibold text-slate-800">{a.patientName}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{a.reason}</p>
                        </td>
                        <td>
                          <p className="font-medium text-slate-800 text-xs">{a.doctorName}</p>
                          <p className="text-[11px] text-teal-700">{a.department}</p>
                        </td>
                        <td>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              a.priority === "Emergency"
                                ? "bg-red-100 text-red-800"
                                : a.priority === "Urgent"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {a.priority || "Normal"}
                          </span>
                        </td>
                        <td>
                          <StatusBadge value={a.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400 text-sm">
                        No appointments scheduled for today yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recently Registered Patients */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-base">Recently Registered Patients</h3>
              <Link
                href="/patients"
                className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
              >
                <span>All Patients</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {data?.recentPatients.map((p) => (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.gender}, {p.age} yrs · Blood: <strong>{p.bloodGroup}</strong>
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                    {p.mrn}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Inpatient Bed Meter + Pharmacy Alerts + Unpaid Invoices */}
        <div className="space-y-6">
          {/* Inpatient Bed Status Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Ward & Bed Occupancy</h3>
              <Link href="/wards" className="text-xs text-teal-700 font-semibold hover:underline">
                View Layout
              </Link>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex mb-3">
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{
                  width: `${
                    data?.wardSummary.total
                      ? (data.wardSummary.occupied / data.wardSummary.total) * 100
                      : 0
                  }%`,
                }}
                title="Occupied"
              ></div>
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{
                  width: `${
                    data?.wardSummary.total
                      ? (data.wardSummary.cleaning / data.wardSummary.total) * 100
                      : 0
                  }%`,
                }}
                title="Cleaning"
              ></div>
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{
                  width: `${
                    data?.wardSummary.total
                      ? (data.wardSummary.available / data.wardSummary.total) * 100
                      : 0
                  }%`,
                }}
                title="Available"
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-slate-500 text-[11px]">Available</p>
                <p className="text-base font-bold text-emerald-800">
                  {data?.wardSummary.available ?? 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                <p className="text-slate-500 text-[11px]">Occupied</p>
                <p className="text-base font-bold text-rose-800">
                  {data?.wardSummary.occupied ?? 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-slate-500 text-[11px]">Cleaning</p>
                <p className="text-base font-bold text-amber-800">
                  {data?.wardSummary.cleaning ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Pharmacy Critical Stock Warning */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">Pharmacy Low Stock</h3>
              </div>
              <Link
                href="/pharmacy"
                className="text-xs text-teal-700 font-semibold hover:underline"
              >
                Inventory
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Items at or below hospital reorder threshold:
            </p>

            <div className="space-y-2">
              {data?.lowStock && data.lowStock.length > 0 ? (
                data.lowStock.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{m.name}</p>
                      <p className="text-[11px] text-amber-800">Min Reorder: {m.minStock} {m.unit}</p>
                    </div>
                    <span className="font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded">
                      {m.stock} {m.unit}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                  All essential pharmacy stocks healthy.
                </div>
              )}
            </div>
          </div>

          {/* Pending Invoices */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-base">Unpaid Invoices</h3>
              <Link
                href="/billing"
                className="text-xs text-teal-700 font-semibold hover:underline"
              >
                Cashier
              </Link>
            </div>
            <div className="space-y-2">
              {data?.unpaidInvoices && data.unpaidInvoices.length > 0 ? (
                data.unpaidInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{inv.patientName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {inv.invoiceNo || inv.id} · {inv.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">Rs {inv.total.toLocaleString()}</p>
                      <StatusBadge value={inv.status} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-3">No unpaid invoices.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
