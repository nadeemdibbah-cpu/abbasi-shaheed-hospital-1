"use client";

import { AppShell, HospitalPrintHeader, PageTitle, StatusBadge } from "@/components/ui";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bed,
  Calendar,
  CreditCard,
  FilePlus,
  FileText,
  FlaskConical,
  HeartPulse,
  Pill,
  Plus,
  Printer,
  Shield,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import type { LabTestItem, Patient, PrescriptionItem, Vitals } from "@/lib/types";

type PatientDetail = {
  patient: Patient;
  appointments: Array<{
    id: string;
    tokenNo?: string;
    date: string;
    time: string;
    doctorName: string;
    department: string;
    status: string;
    reason: string;
  }>;
  records: Array<{
    id: string;
    date: string;
    time?: string;
    doctorName: string;
    chiefComplaint: string;
    history?: string;
    examination?: string;
    diagnosis: string;
    icdCode?: string;
    vitals?: Vitals;
    prescription: PrescriptionItem[];
    labOrdersSuggested?: string[];
    notes: string;
    followUpDate?: string;
  }>;
  invoices: Array<{
    id: string;
    invoiceNo?: string;
    date: string;
    total: number;
    discount?: number;
    paidAmount: number;
    status: string;
    paymentMethod: string;
    items: Array<{ description: string; amount: number; quantity: number }>;
  }>;
  labs: Array<{
    id: string;
    test: string;
    category: string;
    orderedAt: string;
    completedAt?: string;
    status: string;
    doctorName?: string;
    doctorNotes?: string;
    results?: LabTestItem[];
  }>;
  bed?: {
    id: string;
    wardName: string;
    bedNumber: string;
    type: string;
    status: string;
    admittedAt?: string;
  };
  emergencyCase?: {
    id: string;
    triageLevel: string;
    bedNumber: string;
    chiefComplaint: string;
    arrivalTime: string;
    status: string;
  };
};

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<PatientDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"ehr" | "appointments" | "labs" | "billing">("ehr");
  const [loading, setLoading] = useState(true);

  function loadDetail() {
    setLoading(true);
    fetch(`/api/patients/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    if (params.id) {
      loadDetail();
    }
  }, [params.id]);

  const p = data?.patient;

  return (
    <AppShell>
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-4 mb-4 no-print">
        <Link
          href="/patients"
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Patients</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn btn-ghost text-xs flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Patient Chart</span>
          </button>
          <Link
            href="/appointments"
            className="btn btn-primary text-xs flex items-center gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Book OPD Visit</span>
          </Link>
        </div>
      </div>

      <HospitalPrintHeader
        documentTitle="ELECTRONIC HEALTH RECORD (EHR) & PATIENT DOSSIER"
        documentNo={p?.mrn}
        date={new Date().toISOString().slice(0, 10)}
      />

      {/* Patient Main Identity Banner */}
      {p ? (
        <div className="card p-6 mb-6 bg-gradient-to-r from-teal-900 to-[#0d464a] text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white text-2xl font-bold">
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl font-bold tracking-tight text-white">{p.name}</h2>
                  <span className="bg-[#eab308] text-slate-900 font-mono font-bold text-xs px-2.5 py-0.5 rounded-md">
                    {p.mrn}
                  </span>
                  <StatusBadge value={p.status} />
                </div>
                <p className="text-teal-100/80 text-xs mt-1">
                  {p.gender} · {p.age} Years Old {p.dob ? `(DOB: ${p.dob})` : ""}
                  {p.guardianName ? ` · Guardian: ${p.guardianName}` : ""}
                </p>
                <p className="text-teal-200/70 text-xs mt-1">
                  CNIC: <span className="font-mono text-white">{p.cnic || "Not Recorded"}</span> ·
                  Phone: <span className="font-mono text-white">{p.phone}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:self-end">
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10 text-center min-w-[90px]">
                <p className="text-[10px] uppercase tracking-wider text-teal-200">Blood Group</p>
                <p className="text-lg font-bold text-white mt-0.5">{p.bloodGroup}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10 text-center min-w-[120px]">
                <p className="text-[10px] uppercase tracking-wider text-teal-200">Coverage Panel</p>
                <p className="text-sm font-bold text-[#eab308] mt-1">{p.panelType}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Patient Details 3-Column Layout */}
      {p ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Demographics, Vitals, Bed status & Allergies */}
          <div className="space-y-6">
            {/* Vitals Summary Card */}
            <div className="card p-5 border-t-4 border-t-teal-600">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Latest Clinical Vitals</h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {p.vitals?.recordedAt || "Recorded at OPD"}
                </span>
              </div>

              {p.vitals ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[11px] text-slate-500 font-medium">Blood Pressure</p>
                    <p className="text-base font-bold text-slate-900 font-mono">{p.vitals.bp}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[11px] text-slate-500 font-medium">Pulse Rate</p>
                    <p className="text-base font-bold text-slate-900 font-mono">
                      {p.vitals.pulse} <span className="text-xs font-normal text-slate-500">bpm</span>
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[11px] text-slate-500 font-medium">Body Temperature</p>
                    <p
                      className={`text-base font-bold font-mono ${
                        p.vitals.temperature > 99.5 ? "text-red-700" : "text-slate-900"
                      }`}
                    >
                      {p.vitals.temperature}°F
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[11px] text-slate-500 font-medium">Oxygen Sat (SpO2)</p>
                    <p
                      className={`text-base font-bold font-mono ${
                        p.vitals.spO2 < 95 ? "text-red-700" : "text-slate-900"
                      }`}
                    >
                      {p.vitals.spO2}%
                    </p>
                  </div>
                  {p.vitals.bloodSugar ? (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 col-span-2">
                      <p className="text-[11px] text-slate-500 font-medium">Blood Sugar (RBS)</p>
                      <p className="text-base font-bold text-slate-900 font-mono">
                        {p.vitals.bloodSugar} mg/dL
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No vitals logged yet.</p>
              )}
            </div>

            {/* Active Bed / Emergency Status (if any) */}
            {data?.bed ? (
              <div className="card p-4.5 bg-blue-50/50 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Bed className="h-4 w-4 text-blue-700" />
                  <h4 className="font-bold text-blue-900 text-sm">Admitted Inpatient</h4>
                </div>
                <p className="text-xs font-bold text-slate-800">{data.bed.wardName}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Bed: <strong className="font-mono">{data.bed.bedNumber}</strong> ({data.bed.type})
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Admitted: {data.bed.admittedAt || "Recent"}
                </p>
              </div>
            ) : null}

            {data?.emergencyCase ? (
              <div className="card p-4.5 bg-red-50/50 border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <HeartPulse className="h-4 w-4 text-red-700" />
                  <h4 className="font-bold text-red-900 text-sm">Emergency Triage</h4>
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Triage Level:{" "}
                  <span className="text-red-700 font-black">{data.emergencyCase.triageLevel}</span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Bay: <strong className="font-mono">{data.emergencyCase.bedNumber}</strong>
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  {data.emergencyCase.chiefComplaint}
                </p>
              </div>
            ) : null}

            {/* Allergies & Chronic Conditions */}
            <div className="card p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Clinical Alerts</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-bold text-slate-700">Allergies</p>
                  <p
                    className={`mt-0.5 ${
                      p.allergies !== "None" ? "text-red-700 font-semibold" : "text-slate-500"
                    }`}
                  >
                    {p.allergies}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Chronic Conditions</p>
                  <p className="text-slate-600 mt-0.5">{p.chronicConditions || "None recorded"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Address</p>
                  <p className="text-slate-600 mt-0.5">{p.address || "Karachi"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Emergency Contact</p>
                  <p className="text-slate-600 font-mono mt-0.5">
                    {p.emergencyContact || p.phone}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Tabbed Records (EHR Clinical Notes, Appointments, Labs, Billing) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interactive Tabs Header */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-print">
              <button
                onClick={() => setActiveTab("ehr")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "ehr"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>EHR Consultations ({data?.records.length ?? 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("appointments")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "appointments"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>OPD Visits ({data?.appointments.length ?? 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("labs")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "labs"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                <span>Lab Diagnostics ({data?.labs.length ?? 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("billing")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "billing"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Invoices ({data?.invoices.length ?? 0})</span>
              </button>
            </div>

            {/* TAB 1: EHR & Clinical Notes */}
            {activeTab === "ehr" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">
                    Physician Clinical Notes & Prescriptions
                  </h3>
                  <Link
                    href="/records"
                    className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 no-print"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Clinical Consultation</span>
                  </Link>
                </div>

                {data?.records && data.records.length > 0 ? (
                  data.records.map((r) => (
                    <article
                      key={r.id}
                      className="card p-5 border-l-4 border-l-teal-600 transition-all hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-slate-900">{r.diagnosis}</span>
                            {r.icdCode ? (
                              <span className="bg-slate-100 text-slate-600 font-mono text-[11px] px-2 py-0.5 rounded font-bold">
                                ICD: {r.icdCode}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-teal-800 font-medium mt-0.5">
                            Consultant: {r.doctorName}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded">
                          {r.date} {r.time || ""}
                        </span>
                      </div>

                      {/* Chief Complaint & Clinical History */}
                      <div className="mt-3 text-xs space-y-2">
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
                            <strong className="text-slate-700">Physical Exam:</strong>{" "}
                            <span className="text-slate-600">{r.examination}</span>
                          </p>
                        ) : null}
                      </div>

                      {/* Prescriptions */}
                      {r.prescription && r.prescription.length > 0 ? (
                        <div className="mt-4 p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                          <p className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Pill className="h-3.5 w-3.5 text-teal-700" />
                            <span>Prescribed Medications (Rx)</span>
                          </p>
                          <div className="space-y-1.5">
                            {r.prescription.map((rx, idx) => (
                              <div
                                key={idx}
                                className="p-2 bg-white rounded-lg border border-teal-200/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                              >
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {rx.medicineName} —{" "}
                                    <span className="text-teal-700">{rx.dosage}</span>
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    Frequency: <strong>{rx.frequency}</strong> · Duration:{" "}
                                    <strong>{rx.duration}</strong>
                                  </p>
                                </div>
                                {rx.instructions ? (
                                  <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded italic">
                                    {rx.instructions}
                                  </span>
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
                  ))
                ) : (
                  <div className="card p-8 text-center text-slate-400 text-sm">
                    No clinical consultation records found for this patient.
                  </div>
                )}
              </div>
            ) : null}

            {/* TAB 2: OPD Visits & Appointments */}
            {activeTab === "appointments" ? (
              <div className="card p-5">
                <h3 className="font-bold text-slate-900 text-base mb-3">OPD Appointments Log</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date / Time</th>
                      <th>Token</th>
                      <th>Doctor & Dept</th>
                      <th>Reason for Visit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.appointments && data.appointments.length > 0 ? (
                      data.appointments.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <p className="font-semibold text-slate-800 text-xs">{a.date}</p>
                            <p className="text-[11px] text-slate-500">{a.time}</p>
                          </td>
                          <td>
                            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {a.tokenNo || "OPD-001"}
                            </span>
                          </td>
                          <td>
                            <p className="font-medium text-slate-800 text-xs">{a.doctorName}</p>
                            <p className="text-[11px] text-teal-700">{a.department}</p>
                          </td>
                          <td className="text-xs text-slate-600 max-w-xs">{a.reason}</td>
                          <td>
                            <StatusBadge value={a.status} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400 text-sm">
                          No appointment records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}

            {/* TAB 3: Diagnostic Laboratory Reports */}
            {activeTab === "labs" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">Diagnostic Laboratory Reports</h3>
                  <Link
                    href="/lab"
                    className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 no-print"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Order New Lab Test</span>
                  </Link>
                </div>

                {data?.labs && data.labs.length > 0 ? (
                  data.labs.map((l) => (
                    <div key={l.id} className="card p-5 border-l-4 border-l-indigo-600">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-[11px] uppercase font-bold text-indigo-700 tracking-wider">
                            {l.category}
                          </span>
                          <h4 className="font-bold text-slate-900 text-base">{l.test}</h4>
                          <p className="text-xs text-slate-500">Ordered: {l.orderedAt}</p>
                        </div>
                        <StatusBadge value={l.status} />
                      </div>

                      {l.results && l.results.length > 0 ? (
                        <div className="mt-3 overflow-x-auto">
                          <table className="table text-xs">
                            <thead>
                              <tr>
                                <th>Test Parameter</th>
                                <th>Result Value</th>
                                <th>Unit</th>
                                <th>Normal Reference Range</th>
                              </tr>
                            </thead>
                            <tbody>
                              {l.results.map((res, idx) => (
                                <tr
                                  key={idx}
                                  className={res.isAbnormal ? "bg-red-50/50 font-semibold" : ""}
                                >
                                  <td>
                                    {res.name}
                                    {res.isAbnormal ? (
                                      <span className="ml-2 text-[10px] text-red-700 uppercase font-bold">
                                        [Abnormal]
                                      </span>
                                    ) : null}
                                  </td>
                                  <td className={res.isAbnormal ? "text-red-700 font-bold" : ""}>
                                    {res.value}
                                  </td>
                                  <td className="text-slate-500 font-mono">{res.unit}</td>
                                  <td className="text-slate-500 font-mono">{res.normalRange}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 mt-2 italic">
                          Test order is currently {l.status.toLowerCase()}. Results pending.
                        </p>
                      )}

                      {l.doctorNotes ? (
                        <div className="mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <strong className="text-slate-700">Pathologist / Doctor Remarks:</strong>{" "}
                          {l.doctorNotes}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="card p-8 text-center text-slate-400 text-sm">
                    No diagnostic laboratory tests on file.
                  </div>
                )}
              </div>
            ) : null}

            {/* TAB 4: Invoices & Hospital Billing */}
            {activeTab === "billing" ? (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-base">Patient Billing History</h3>
                  <Link
                    href="/billing"
                    className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 no-print"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Generate New Bill</span>
                  </Link>
                </div>

                <div className="space-y-3">
                  {data?.invoices && data.invoices.length > 0 ? (
                    data.invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {inv.invoiceNo || inv.id}
                            </span>
                            <StatusBadge value={inv.status} />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Date: {inv.date} · Method: <strong>{inv.paymentMethod}</strong>
                          </p>
                          <div className="text-[11px] text-slate-600 mt-1">
                            {inv.items?.map((it, idx) => (
                              <span key={idx} className="mr-2">
                                • {it.description} (Rs {it.amount})
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-base font-black text-slate-900 font-mono">
                            Rs {inv.total.toLocaleString()}
                          </p>
                          {inv.discount ? (
                            <p className="text-[11px] text-emerald-700">
                              Saved: Rs {inv.discount.toLocaleString()} (Subsidy)
                            </p>
                          ) : null}
                          <p className="text-xs text-slate-600">
                            Paid: Rs {inv.paidAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-slate-400 text-sm">
                      No invoices found for this patient.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">Loading patient chart...</div>
      )}
    </AppShell>
  );
}
