"use client";

import { AppShell, HospitalPrintHeader, PageTitle } from "@/components/ui";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bed,
  CheckCircle2,
  CreditCard,
  FileText,
  FlaskConical,
  HeartPulse,
  Pill,
  Printer,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";

type ReportsData = {
  financial: {
    totalBilled: number;
    totalCollected: number;
    totalSubsidized: number;
    outstandingAmount: number;
    paidInvoicesCount: number;
    unpaidInvoicesCount: number;
  };
  departmentBreakdown: Array<{
    department: string;
    count: number;
  }>;
  topDiagnoses: Array<{
    diagnosis: string;
    count: number;
  }>;
  bedStats: {
    total: number;
    occupied: number;
    available: number;
    cleaning: number;
  };
  pharmacyStats: {
    totalMedicines: number;
    lowStockMedicines: number;
    totalInventoryValue: number;
  };
  totalPatients: number;
  totalDoctors: number;
  totalLabOrders: number;
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalDeptPatients =
    data?.departmentBreakdown.reduce((sum, d) => sum + d.count, 0) || 1;

  const totalDiagnoses =
    data?.topDiagnoses.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <AppShell>
      <PageTitle
        title="Executive Analytics & Operations Reports"
        subtitle="Hospital throughput, disease epidemiology, revenue performance, and clinical statistics."
      >
        <button
          onClick={() => window.print()}
          className="btn btn-primary text-xs flex items-center gap-1.5 no-print"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Executive Report</span>
        </button>
      </PageTitle>

      <HospitalPrintHeader documentTitle="ANNUAL / MONTHLY EXECUTIVE HOSPITAL OPERATIONS REPORT" />

      {/* Main Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4.5 border-l-4 border-l-teal-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Patients</span>
            <Users className="h-4 w-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{data?.totalPatients ?? 0}</p>
          <p className="text-[11px] text-teal-700 mt-0.5">Central MRN Registry</p>
        </div>

        <div className="card p-4.5 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Collected Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-800 mt-2">
            Rs {(data?.financial.totalCollected ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-700 mt-0.5">Realized hospital receipts</p>
        </div>

        <div className="card p-4.5 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Diagnostics Performed</span>
            <FlaskConical className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-900 mt-2">{data?.totalLabOrders ?? 0}</p>
          <p className="text-[11px] text-indigo-700 mt-0.5">Pathology & Radiology</p>
        </div>

        <div className="card p-4.5 border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Welfare Subsidies</span>
            <HeartPulse className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-900 mt-2">
            Rs {(data?.financial.totalSubsidized ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-purple-700 mt-0.5">Sehat Sahulat & KMC Relief</p>
        </div>
      </div>

      {/* Two-Column Analytics Layout */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Department OPD Volume Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-teal-700" />
              <h3 className="font-bold text-slate-900 text-base">OPD Clinic Volume by Specialty</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Patient Visits</span>
          </div>

          <div className="space-y-3.5">
            {data?.departmentBreakdown && data.departmentBreakdown.length > 0 ? (
              data.departmentBreakdown.map((dept, idx) => {
                const pct = Math.round((dept.count / totalDeptPatients) * 100);
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-800">{dept.department}</span>
                      <span className="text-teal-900 font-mono">
                        {dept.count} visits ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-6 text-slate-400 text-sm">No department data recorded.</p>
            )}
          </div>
        </div>

        {/* Top Epidemiological Diagnoses */}
        <div className="card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-700" />
              <h3 className="font-bold text-slate-900 text-base">Top Disease Presentations</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">EHR Analytics</span>
          </div>

          <div className="space-y-3.5">
            {data?.topDiagnoses && data.topDiagnoses.length > 0 ? (
              data.topDiagnoses.map((diag, idx) => {
                const pct = Math.round((diag.count / totalDiagnoses) * 100);
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-800 line-clamp-1">{diag.diagnosis}</span>
                      <span className="text-indigo-900 font-mono shrink-0 ml-2">
                        {diag.count} cases ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-6 text-slate-400 text-sm">No clinical diagnoses logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Financial & Inpatient Deep-Dive */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Financial Breakdown */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 text-base mb-3">Financial Performance</h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Total Billed:</span>
              <strong className="font-mono text-slate-900">
                Rs {(data?.financial.totalBilled ?? 0).toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Collected Revenue:</span>
              <strong className="font-mono text-emerald-700">
                Rs {(data?.financial.totalCollected ?? 0).toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Government Subsidies Absorbed:</span>
              <strong className="font-mono text-purple-700">
                Rs {(data?.financial.totalSubsidized ?? 0).toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Outstanding Balance:</span>
              <strong className="font-mono text-rose-700">
                Rs {(data?.financial.outstandingAmount ?? 0).toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">Settled Invoices:</span>
              <strong className="text-slate-800">
                {data?.financial.paidInvoicesCount ?? 0} Paid /{" "}
                {data?.financial.unpaidInvoicesCount ?? 0} Pending
              </strong>
            </div>
          </div>
        </div>

        {/* Inpatient Bed Status */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 text-base mb-3">Inpatient Bed Utilization</h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Total Ward Beds:</span>
              <strong className="font-mono text-slate-900">{data?.bedStats.total ?? 0}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Currently Occupied:</span>
              <strong className="font-mono text-rose-700">{data?.bedStats.occupied ?? 0}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Available Ready Beds:</span>
              <strong className="font-mono text-emerald-700">{data?.bedStats.available ?? 0}</strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">Sanitization & Maintenance:</span>
              <strong className="font-mono text-amber-700">{data?.bedStats.cleaning ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* Central Pharmacy Inventory */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 text-base mb-3">Pharmacy Formulary Status</h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Formulations Stocked:</span>
              <strong className="font-mono text-slate-900">
                {data?.pharmacyStats.totalMedicines ?? 0}
              </strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Low Stock Reorders:</span>
              <strong className="font-mono text-amber-700">
                {data?.pharmacyStats.lowStockMedicines ?? 0}
              </strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">Stock Asset Valuation:</span>
              <strong className="font-mono text-emerald-800">
                Rs {(data?.pharmacyStats.totalInventoryValue ?? 0).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
