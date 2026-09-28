"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  Activity,
  Bed,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  HeartPulse,
  Lock,
  Pill,
  Shield,
  Stethoscope,
  User,
  Users,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    role: "Medical Superintendent (Admin)",
    user: "admin",
    pass: "admin123",
    desc: "Hospital Administration MS Office · Full control & operations",
    color: "from-teal-600 to-teal-800",
  },
  {
    role: "Chief Consultant Physician",
    user: "doctor",
    pass: "doctor123",
    desc: "Prof. Dr. Muhammad Nadeem · EHR Consultations, Digital Rx & OPD",
    color: "from-blue-600 to-blue-800",
  },
  {
    role: "OPD Reception Desk",
    user: "reception",
    pass: "rec123",
    desc: "Sana Farhan · Patient registration, MRN index & OPD token booking",
    color: "from-amber-600 to-amber-800",
  },
  {
    role: "Hospital Pharmacist",
    user: "pharmacy",
    pass: "pharma123",
    desc: "Muhammad Imran Ali · Drug inventory, stock dispensing & reorders",
    color: "from-emerald-600 to-emerald-800",
  },
  {
    role: "Emergency Triage Nurse",
    user: "nurse",
    pass: "nurse123",
    desc: "Sister Fatima Zahra · 24/7 ER Trauma intake & Red/Yellow/Green triage",
    color: "from-rose-600 to-rose-800",
  },
  {
    role: "Senior Lab Technologist",
    user: "labtech",
    pass: "lab123",
    desc: "Muhammad Zubair Siddiqui · Pathology test processing & diagnostic reports",
    color: "from-indigo-600 to-indigo-800",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("doctor");
  const [password, setPassword] = useState("doctor123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Invalid credentials. Please verify username and password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  function selectDemoAccount(user: string, pass: string) {
    setUsername(user);
    setPassword(pass);
    setError("");
  }

  return (
    <div className="ash-bg min-h-screen flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between py-2 text-white/90">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] flex items-center justify-center text-white shadow-lg shadow-teal-950/60">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.24em] uppercase font-bold text-[#eab308]">
              Karachi Metropolitan Corporation
            </p>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
              Abbasi Shaheed Hospital
            </h1>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            <span>Emergency: <strong>24/7 STAT</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 font-mono">
            <span>UAN: <strong>021-99260300</strong></span>
          </div>
        </div>
      </header>

      {/* Hero & Login Section */}
      <main className="max-w-7xl w-full mx-auto my-auto py-8 grid lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Hospital Overview & Key Modules */}
        <div className="lg:col-span-6 text-white space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold">
            <Shield className="h-3.5 w-3.5 text-[#eab308]" />
            <span>KMDC Teaching Hospital & Tertiary Care Center</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Modern Hospital Management & EHR Platform
          </h2>

          <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-xl">
            Central clinical & operations portal for <strong>Abbasi Shaheed Hospital</strong> —
            leading consultant: <strong>Prof. Dr. Muhammad Nadeem</strong> (Head of Internal Medicine).
            Includes 24/7 emergency triage, OPD token queuing, electronic health records with digital Rx,
            inpatient bed maps, pathology lab, pharmacy inventory, and Sehat Sahulat billing.
          </p>

          {/* Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 max-w-lg">
            <div className="p-3 rounded-xl bg-white/5 backdrop-blur border border-white/10 flex items-start gap-2.5">
              <HeartPulse className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-white">24/7 ER Trauma Triage</p>
                <p className="text-[11px] text-white/70">Red/Yellow/Green prioritization</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 backdrop-blur border border-white/10 flex items-start gap-2.5">
              <Calendar className="h-5 w-5 text-teal-300 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-white">OPD Token Queue</p>
                <p className="text-[11px] text-white/70">Central clinic roster & calling</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 backdrop-blur border border-white/10 flex items-start gap-2.5">
              <FileText className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-white">EHR & Digital Rx</p>
                <p className="text-[11px] text-white/70">ICD-10 coding & print cards</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 backdrop-blur border border-white/10 flex items-start gap-2.5">
              <Bed className="h-5 w-5 text-blue-300 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-white">Inpatient Ward Beds</p>
                <p className="text-[11px] text-white/70">CCU, ICU & General bed map</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Card & 1-Click Role Logins */}
        <div className="lg:col-span-6">
          <div className="card p-6 sm:p-8 bg-white/95 backdrop-blur shadow-2xl border-white/50">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-900">Hospital Staff Portal</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your credentials or click a pre-configured department account below:
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    className="input pl-9 text-xs"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Access Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    className="input pl-9 text-xs"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error ? (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  ⚠️ {error}
                </div>
              ) : null}

              <button
                type="submit"
                className="btn btn-primary w-full py-2.5 text-sm shadow-md"
                disabled={loading}
              >
                {loading ? "Authenticating Staff..." : "Sign In to Hospital Management System"}
              </button>
            </form>

            {/* Quick Demo Role Picker */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Instant 1-Click Role Logins:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = username === acc.user;
                  return (
                    <button
                      key={acc.user}
                      type="button"
                      onClick={() => selectDemoAccount(acc.user, acc.pass)}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-teal-50 border-teal-600 ring-1 ring-teal-600"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">{acc.role}</p>
                        {isSelected ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {acc.user} / {acc.pass}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">{acc.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto py-3 text-center text-xs text-white/60">
        © 2026 Abbasi Shaheed Hospital — Karachi Metropolitan Corporation (KMC) & Karachi Medical & Dental College (KMDC). All rights reserved.
      </footer>
    </div>
  );
}
