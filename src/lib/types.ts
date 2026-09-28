export type Role = "admin" | "doctor" | "receptionist" | "pharmacist" | "nurse" | "lab_technician";

export type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: Role;
  department?: string;
  avatar?: string;
  email?: string;
  phone?: string;
};

export type Vitals = {
  bp: string; // e.g. "120/80"
  pulse: number; // bpm
  temperature: number; // °F
  spO2: number; // %
  respiratoryRate?: number; // breaths/min
  weight?: number; // kg
  height?: number; // cm
  bmi?: number;
  bloodSugar?: number; // mg/dL
  recordedAt: string;
};

export type Patient = {
  id: string;
  mrn: string; // Medical Record Number, e.g. "ASH-10021"
  name: string;
  gender: "Male" | "Female" | "Other";
  age: number;
  dob?: string;
  phone: string;
  cnic: string; // Pakistani CNIC e.g. "42101-1234567-1"
  guardianName?: string;
  emergencyContact?: string;
  address: string;
  bloodGroup: string;
  allergies: string;
  chronicConditions?: string;
  panelType: "Private" | "Sehat Sahulat" | "KMC Staff" | "Indigent/Free";
  status: "Outpatient" | "Admitted" | "Emergency" | "Discharged";
  vitals?: Vitals;
  registeredAt: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  department: string;
  qualification: string;
  pmdcReg: string;
  roomNo: string;
  phone: string;
  email: string;
  days: string;
  timing: string;
  fee: number;
  maxDailyTokens: number;
  status: "Available" | "In OPD" | "On Leave" | "In Surgery";
};

export type AppointmentStatus = "Scheduled" | "Checked-in" | "In-Consultation" | "Completed" | "Cancelled";
export type AppointmentPriority = "Normal" | "Urgent" | "Emergency";

export type Appointment = {
  id: string;
  tokenNo: string; // e.g. "OPD-MED-042"
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  department: string;
  reason: string;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  notes?: string;
};

export type PrescriptionItem = {
  medicineId?: string;
  medicineName: string;
  dosage: string; // e.g. "500mg"
  frequency: string; // e.g. "1-0-1 (Twice daily after meals)"
  duration: string; // e.g. "5 days"
  instructions: string; // e.g. "Take with plenty of water"
};

export type RecordNote = {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time?: string;
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
};

export type EmergencyTriageLevel = "Red" | "Yellow" | "Green";

export type EmergencyPatient = {
  id: string;
  patientId: string;
  triageLevel: EmergencyTriageLevel;
  bedNumber: string;
  chiefComplaint: string;
  vitals: Vitals;
  attendingDoctorId: string;
  arrivalTime: string;
  status: "Triage" | "Treatment" | "Admitted" | "Discharged" | "Transferred";
  notes?: string;
};

export type WardBed = {
  id: string;
  wardName: string;
  bedNumber: string;
  type: "General" | "ICU" | "CCU" | "Emergency" | "Post-Op" | "Pediatric";
  status: "Available" | "Occupied" | "Maintenance" | "Cleaning";
  patientId?: string;
  doctorId?: string;
  admittedAt?: string;
  notes?: string;
};

export type LabStatus = "Ordered" | "Sample Collected" | "Processing" | "Completed" | "Cancelled";

export type LabTestItem = {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  isAbnormal?: boolean;
};

export type LabOrder = {
  id: string;
  patientId: string;
  doctorId?: string;
  test: string;
  category: "Hematology" | "Biochemistry" | "Radiology" | "Microbiology" | "Pathology" | "Cardiology";
  orderedAt: string;
  completedAt?: string;
  status: LabStatus;
  results?: LabTestItem[];
  doctorNotes?: string;
  technicianName?: string;
};

export type Medicine = {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosageForm: string; // e.g. "Tablet", "Syrup", "Injection", "IV Fluid"
  stock: number;
  minStock: number;
  unit: string;
  price: number;
  expiry: string;
  batchNo: string;
  manufacturer: string;
};

export type InvoiceStatus = "Unpaid" | "Paid" | "Partial";

export type InvoiceItem = {
  description: string;
  category: "Consultation" | "Lab" | "Pharmacy" | "Procedure" | "Bed Charge" | "Other";
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type Invoice = {
  id: string;
  invoiceNo: string; // e.g. "ASH-INV-2026-0041"
  patientId: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number; // e.g. KMC subsidy
  subsidyNote?: string;
  total: number;
  paidAmount: number;
  paymentMethod: "Cash" | "Card" | "Sehat Sahulat" | "Online";
  status: InvoiceStatus;
  receiptNotes?: string;
};

export type Database = {
  users: User[];
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  records: RecordNote[];
  emergencyPatients: EmergencyPatient[];
  wardBeds: WardBed[];
  labOrders: LabOrder[];
  medicines: Medicine[];
  invoices: Invoice[];
};
