import type { Database, Doctor, Patient } from "./types";

export function patientName(db: Database, id: string): string {
  return db.patients.find((p) => p.id === id)?.name ?? "Unknown Patient";
}

export function patientObj(db: Database, id: string): Patient | undefined {
  return db.patients.find((p) => p.id === id);
}

export function doctorName(db: Database, id: string): string {
  return db.doctors.find((d) => d.id === id)?.name ?? "Unknown Doctor";
}

export function doctorObj(db: Database, id: string): Doctor | undefined {
  return db.doctors.find((d) => d.id === id);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowTimeStr(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatCurrency(amount: number): string {
  return `Rs ${Number(amount || 0).toLocaleString("en-PK")}`;
}

export function generateMRN(db: Database): string {
  const maxNum = db.patients.reduce((max, p) => {
    const match = p.mrn.match(/ASH-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 10020);
  return `ASH-${maxNum + 1}`;
}

export function generateToken(department: string, db: Database): string {
  const codeMap: Record<string, string> = {
    "Internal Medicine": "MED",
    "General Surgery": "SURG",
    "Gynae & Obs": "GYN",
    "Orthopedics & Trauma": "ORTHO",
    "Pediatrics & Neonatology": "PED",
    "Cardiology & CCU": "CARD",
    "Emergency Medicine": "ER",
  };
  const deptCode = codeMap[department] || "GEN";
  const today = todayISO();
  const countToday = db.appointments.filter((a) => a.date === today && a.department === department).length;
  const seq = String(countToday + 1).padStart(3, "0");
  return `OPD-${deptCode}-${seq}`;
}

export function generateInvoiceNo(db: Database): string {
  const year = new Date().getFullYear();
  const count = db.invoices.length + 1;
  return `ASH-INV-${year}-${String(count).padStart(4, "0")}`;
}
