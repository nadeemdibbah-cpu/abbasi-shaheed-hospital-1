import { jsonOk, withAuth } from "@/lib/api";
import { readDb } from "@/lib/store";

export async function GET() {
  const { error } = await withAuth();
  if (error) return error;
  const db = await readDb();

  // Financial aggregates
  const totalBilled = db.invoices.reduce((sum, i) => sum + i.total, 0);
  const totalCollected = db.invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  const totalSubsidized = db.invoices.reduce((sum, i) => sum + (i.discount || 0), 0);
  const outstandingBills = db.invoices.filter((i) => i.status !== "Paid");

  // Department distribution from appointments
  const deptMap: Record<string, number> = {};
  for (const appt of db.appointments) {
    deptMap[appt.department] = (deptMap[appt.department] || 0) + 1;
  }
  const departmentBreakdown = Object.entries(deptMap).map(([dept, count]) => ({
    department: dept,
    count,
  }));

  // Top Diagnoses from EHR
  const diagMap: Record<string, number> = {};
  for (const rec of db.records) {
    diagMap[rec.diagnosis] = (diagMap[rec.diagnosis] || 0) + 1;
  }
  const topDiagnoses = Object.entries(diagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([diagnosis, count]) => ({ diagnosis, count }));

  // Bed status distribution
  const bedStats = {
    total: db.wardBeds.length,
    occupied: db.wardBeds.filter((b) => b.status === "Occupied").length,
    available: db.wardBeds.filter((b) => b.status === "Available").length,
    cleaning: db.wardBeds.filter((b) => b.status === "Cleaning" || b.status === "Maintenance").length,
  };

  // Pharmacy stock status
  const totalMedicines = db.medicines.length;
  const lowStockMedicines = db.medicines.filter((m) => m.stock <= m.minStock).length;
  const totalInventoryValue = db.medicines.reduce((sum, m) => sum + m.stock * m.price, 0);

  return jsonOk({
    financial: {
      totalBilled,
      totalCollected,
      totalSubsidized,
      outstandingAmount: totalBilled - totalCollected,
      paidInvoicesCount: db.invoices.filter((i) => i.status === "Paid").length,
      unpaidInvoicesCount: outstandingBills.length,
    },
    departmentBreakdown,
    topDiagnoses,
    bedStats,
    pharmacyStats: {
      totalMedicines,
      lowStockMedicines,
      totalInventoryValue,
    },
    totalPatients: db.patients.length,
    totalDoctors: db.doctors.length,
    totalLabOrders: db.labOrders.length,
  });
}
