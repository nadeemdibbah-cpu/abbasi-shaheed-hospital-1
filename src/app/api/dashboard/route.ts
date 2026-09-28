import { jsonOk, withAuth } from "@/lib/api";
import { doctorName, patientName, todayISO } from "@/lib/helpers";
import { readDb } from "@/lib/store";

export async function GET() {
  const { error } = await withAuth();
  if (error) return error;
  const db = await readDb();
  const today = todayISO();

  const todayAppointments = db.appointments.filter((a) => a.date === today && a.status !== "Cancelled");
  const unpaid = db.invoices.filter((i) => i.status !== "Paid");
  const lowStock = db.medicines.filter((m) => m.stock <= m.minStock);
  const pendingLabs = db.labOrders.filter((l) => l.status !== "Completed" && l.status !== "Cancelled");
  const activeEmergency = db.emergencyPatients.filter((e) => e.status === "Triage" || e.status === "Treatment");

  const totalBeds = db.wardBeds.length;
  const occupiedBeds = db.wardBeds.filter((b) => b.status === "Occupied").length;
  const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const totalRevenue = db.invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const pendingRevenue = db.invoices.reduce((sum, inv) => sum + (inv.total - (inv.paidAmount || 0)), 0);

  return jsonOk({
    stats: {
      patients: db.patients.length,
      doctors: db.doctors.length,
      todayAppointments: todayAppointments.length,
      emergencyActive: activeEmergency.length,
      totalBeds,
      occupiedBeds,
      bedOccupancyRate,
      unpaidBills: unpaid.length,
      lowStock: lowStock.length,
      pendingLabs: pendingLabs.length,
      totalRevenue,
      pendingRevenue,
    },
    todayAppointments: todayAppointments.map((a) => ({
      ...a,
      patientName: patientName(db, a.patientId),
      doctorName: doctorName(db, a.doctorId),
    })),
    recentPatients: [...db.patients]
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
      .slice(0, 5),
    emergencyQueue: activeEmergency.map((e) => ({
      ...e,
      patientName: patientName(db, e.patientId),
      doctorName: doctorName(db, e.attendingDoctorId),
    })),
    lowStock,
    unpaidInvoices: unpaid.map((i) => ({
      ...i,
      patientName: patientName(db, i.patientId),
    })),
    wardSummary: {
      total: totalBeds,
      occupied: occupiedBeds,
      available: db.wardBeds.filter((b) => b.status === "Available").length,
      cleaning: db.wardBeds.filter((b) => b.status === "Cleaning" || b.status === "Maintenance").length,
    },
  });
}
