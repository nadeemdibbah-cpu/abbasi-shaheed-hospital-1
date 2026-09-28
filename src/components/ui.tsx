"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bed,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  HeartPulse,
  LogOut,
  Pill,
  Plus,
  Printer,
  Search,
  Shield,
  Stethoscope,
  UserCheck,
  Users,
  X,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/emergency", label: "Emergency 24/7", icon: HeartPulse, badge: "ER" },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/appointments", label: "OPD & Appointments", icon: Calendar },
  { href: "/doctors", label: "Doctors & Roster", icon: Stethoscope },
  { href: "/records", label: "EHR & Prescriptions", icon: FileText },
  { href: "/wards", label: "Wards & Beds", icon: Bed },
  { href: "/lab", label: "Laboratory", icon: FlaskConical },
  { href: "/pharmacy", label: "Pharmacy & Stock", icon: Pill },
  { href: "/billing", label: "Billing & Cashier", icon: CreditCard },
  { href: "/reports", label: "Analytics & Reports", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string; department?: string } | null>(null);
  const [timeStr, setTimeStr] = useState<string>("");
  const [erCount, setErCount] = useState<number>(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    patients: Array<{ id: string; name: string; mrn: string; phone: string }>;
    doctors: Array<{ id: string; name: string; department: string }>;
  }>({ patients: [], doctors: [] });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));

    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.stats?.emergencyActive !== undefined) {
          setErCount(d.stats.emergencyActive);
        }
      })
      .catch(() => {});

    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Quick search effect
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ patients: [], doctors: [] });
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          fetch(`/api/patients?q=${encodeURIComponent(searchQuery)}`),
          fetch(`/api/doctors`),
        ]);
        const pts = await pRes.json();
        const docs = await dRes.json();
        const filteredDocs = Array.isArray(docs)
          ? docs.filter((d: { name: string; department: string }) =>
              `${d.name} ${d.department}`.toLowerCase().includes(searchQuery.toLowerCase()),
            )
          : [];
        setSearchResults({
          patients: Array.isArray(pts) ? pts.slice(0, 5) : [],
          doctors: filteredDocs.slice(0, 4),
        });
      } catch {
        // silent fail
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[270px_1fr] bg-[#f4f7f6]">
      {/* Sidebar */}
      <aside className="ash-bg text-white p-5 flex flex-col justify-between border-r border-[#134e4a]/40 shadow-xl no-print">
        <div>
          {/* Hospital Logo & Header */}
          <div className="mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] flex items-center justify-center text-white shadow-md shadow-teal-900/40">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] tracking-[0.22em] uppercase font-bold text-[#eab308]">
                  KMC Teaching Hospital
                </p>
                <h1 className="text-[17px] font-bold tracking-tight text-white leading-tight">
                  Abbasi Shaheed
                </h1>
              </div>
            </div>
            <p className="text-[11.5px] text-teal-100/70 mt-1.5 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              North Nazimabad, Karachi (KMDC)
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150 ${
                    active
                      ? "bg-white text-[#0f4b50] font-bold shadow-md shadow-black/10"
                      : "text-teal-50/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 ${active ? "text-[#0f766e]" : "text-teal-200/70"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md animate-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Account & Quick Role Indicator */}
        <div className="pt-4 mt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-teal-800 border border-teal-500/50 flex items-center justify-center text-teal-100 font-bold text-xs uppercase">
                {user?.name ? user.name.slice(0, 2) : "ASH"}
              </div>
              <div className="overflow-hidden">
                <p className="text-[13px] font-semibold text-white truncate max-w-[135px]">
                  {user?.name ?? "Hospital Staff"}
                </p>
                <p className="text-[11px] text-teal-200/70 capitalize truncate">
                  {user?.role ?? "Staff"} · {user?.department || "Central"}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 rounded-lg text-teal-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-3.5 flex items-center justify-between no-print shadow-xs">
          {/* Quick Search trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-600 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <span>Search Patient (MRN / CNIC / Name) or Doctor...</span>
              <kbd className="hidden sm:inline-block bg-white text-[10px] px-1.5 py-0.5 rounded border border-slate-300 text-slate-500">
                /
              </kbd>
            </button>

            {erCount > 0 ? (
              <Link
                href="/emergency"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold animate-pulse"
              >
                <span className="h-2 w-2 rounded-full bg-red-600"></span>
                <span>{erCount} Active ER Trauma Case{erCount > 1 ? "s" : ""}</span>
              </Link>
            ) : null}
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Clock className="h-3.5 w-3.5 text-teal-600" />
              <span className="font-semibold text-slate-800">{timeStr || "Loading clock..."}</span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-700 font-medium">PKT (Karachi)</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/appointments"
                className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New OPD Token</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Main View */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto">{children}</main>

        {/* Global Footer */}
        <footer className="px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 no-print bg-white/50">
          <div>
            <strong>Abbasi Shaheed Hospital (ASH)</strong> — Karachi Metropolitan Corporation (KMC) & Karachi Medical & Dental College (KMDC).
          </div>
          <div className="flex items-center gap-3">
            <span>Helpline: <strong>021-99260300</strong></span>
            <span>·</span>
            <span>Emergency: <strong>24/7 STAT</strong></span>
          </div>
        </footer>
      </div>

      {/* Quick Search Modal */}
      {searchOpen ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4 z-50 no-print">
          <div className="card p-5 w-full max-w-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-5 w-5 text-teal-600" />
                <input
                  autoFocus
                  className="w-full bg-transparent text-base font-medium outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder="Type patient name, MRN (e.g. ASH-10021), CNIC, or doctor name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto">
              {searchQuery.trim().length < 2 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Type at least 2 characters to search across hospital records.
                </p>
              ) : null}

              {searchResults.patients.length > 0 ? (
                <div className="mb-4">
                  <p className="text-xs uppercase font-bold text-teal-700 tracking-wider mb-2">Patients</p>
                  <div className="flex flex-col gap-1.5">
                    {searchResults.patients.map((p) => (
                      <Link
                        key={p.id}
                        href={`/patients/${p.id}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-teal-50/60 border border-transparent hover:border-teal-200 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-500">Phone: {p.phone}</p>
                        </div>
                        <span className="badge badge-teal font-mono">{p.mrn}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {searchResults.doctors.length > 0 ? (
                <div>
                  <p className="text-xs uppercase font-bold text-slate-600 tracking-wider mb-2">Doctors</p>
                  <div className="flex flex-col gap-1.5">
                    {searchResults.doctors.map((d) => (
                      <Link
                        key={d.id}
                        href="/doctors"
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                          <p className="text-xs text-slate-500">{d.department}</p>
                        </div>
                        <span className="badge badge-blue">Consultant</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {searchQuery.trim().length >= 2 &&
              searchResults.patients.length === 0 &&
              searchResults.doctors.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No records found matching &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    // Appointments & General
    Scheduled: "badge-blue",
    "Checked-in": "badge-amber",
    "In-Consultation": "badge-purple",
    Completed: "badge-green",
    Cancelled: "badge-gray",

    // Invoices / Billing
    Paid: "badge-green",
    Unpaid: "badge-red",
    Partial: "badge-amber",

    // Lab
    Ordered: "badge-blue",
    "Sample Collected": "badge-amber",
    Processing: "badge-purple",

    // Beds
    Available: "badge-green",
    Occupied: "badge-red",
    Cleaning: "badge-amber",
    Maintenance: "badge-gray",

    // Patient Status
    Outpatient: "badge-blue",
    Admitted: "badge-purple",
    Emergency: "badge-red",
    Discharged: "badge-gray",

    // Triage
    Red: "badge-red font-bold",
    Yellow: "badge-amber font-bold",
    Green: "badge-green font-bold",
  };
  return <span className={`badge ${map[value] ?? "badge-gray"}`}>{value}</span>;
}

export function PageTitle({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
      {children ? <div className="flex items-center gap-2.5 flex-wrap">{children}</div> : null}
    </div>
  );
}

export function HospitalPrintHeader({
  documentTitle,
  documentNo,
  date,
}: {
  documentTitle: string;
  documentNo?: string;
  date?: string;
}) {
  return (
    <div className="hidden print-only mb-6 pb-4 border-b-2 border-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-slate-600">
            Karachi Metropolitan Corporation (KMC)
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            ABBASI SHAHEED HOSPITAL
          </h1>
          <p className="text-xs text-slate-600">
            Teaching Hospital of Karachi Medical & Dental College (KMDC)
          </p>
          <p className="text-[11px] text-slate-500">
            Block M, North Nazimabad, Karachi | UAN: 021-99260300 | Emergency: 24/7
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-sm uppercase rounded">
            {documentTitle}
          </span>
          {documentNo ? (
            <p className="text-xs font-mono font-bold mt-1 text-slate-800">No: {documentNo}</p>
          ) : null}
          {date ? <p className="text-xs text-slate-600">Date: {date}</p> : null}
        </div>
      </div>
    </div>
  );
}
