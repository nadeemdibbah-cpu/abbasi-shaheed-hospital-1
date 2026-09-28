"use client";

import { AppShell, HospitalPrintHeader, PageTitle } from "@/components/ui";
import { FormEvent, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Filter,
  PackagePlus,
  Pill,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import type { Medicine } from "@/lib/types";

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDispenseModal, setOpenDispenseModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [dispenseQty, setDispenseQty] = useState<number>(1);
  const [dispenseError, setDispenseError] = useState<string>("");
  const [restockQty, setRestockQty] = useState<number>(50);
  const [openRestockModal, setOpenRestockModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Drug Form
  const [drugForm, setDrugForm] = useState({
    name: "",
    genericName: "",
    category: "Antibiotics / Anti-infectives",
    dosageForm: "Tablet",
    stock: 100,
    minStock: 25,
    unit: "tablets",
    price: 15,
    expiry: "2027-12-31",
    batchNo: "BAT-2026-01",
    manufacturer: "Local Pharmaceutical",
  });

  function loadMedicines() {
    let url = "/api/pharmacy";
    if (lowStockOnly) url += "?lowOnly=true";

    fetch(url)
      .then((r) => r.json())
      .then(setMedicines)
      .catch(() => {});
  }

  useEffect(() => {
    loadMedicines();
  }, [lowStockOnly]);

  async function createMedicine(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/pharmacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...drugForm,
        stock: Number(drugForm.stock),
        minStock: Number(drugForm.minStock),
        price: Number(drugForm.price),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpenAddModal(false);
      setDrugForm({
        name: "",
        genericName: "",
        category: "Antibiotics / Anti-infectives",
        dosageForm: "Tablet",
        stock: 100,
        minStock: 25,
        unit: "tablets",
        price: 15,
        expiry: "2027-12-31",
        batchNo: "BAT-2026-01",
        manufacturer: "Local Pharmaceutical",
      });
      loadMedicines();
    }
  }

  async function handleDispense(e: FormEvent) {
    e.preventDefault();
    if (!selectedMed) return;
    setDispenseError("");
    setLoading(true);
    const res = await fetch("/api/pharmacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedMed.id,
        action: "dispense",
        quantity: Number(dispenseQty),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setDispenseError(data.error || "Dispensing failed");
      return;
    }
    setOpenDispenseModal(false);
    setSelectedMed(null);
    setDispenseQty(1);
    loadMedicines();
  }

  async function handleRestock(e: FormEvent) {
    e.preventDefault();
    if (!selectedMed) return;
    setLoading(true);
    const res = await fetch("/api/pharmacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedMed.id,
        action: "restock",
        quantity: Number(restockQty),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpenRestockModal(false);
      setSelectedMed(null);
      setRestockQty(50);
      loadMedicines();
    }
  }

  const categories = Array.from(new Set(medicines.map((m) => m.category)));

  const filtered = medicines.filter((m) => {
    const matchQ = `${m.name} ${m.genericName} ${m.category} ${m.manufacturer}`
      .toLowerCase()
      .includes(q.toLowerCase());
    const matchCat = selectedCategory === "All" || m.category === selectedCategory;
    return matchQ && matchCat;
  });

  const lowStockCount = medicines.filter((m) => m.stock <= m.minStock).length;
  const totalValue = medicines.reduce((sum, m) => sum + m.stock * m.price, 0);

  return (
    <AppShell>
      <PageTitle
        title="Hospital Pharmacy & Drug Inventory"
        subtitle="Central medication inventory, POS dispensing, low-stock reorder alerts & batch tracking."
      >
        <button
          onClick={() => window.print()}
          className="btn btn-ghost text-xs flex items-center gap-1.5 no-print"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Inventory Report</span>
        </button>
        <button
          onClick={() => setOpenAddModal(true)}
          className="btn btn-primary text-xs flex items-center gap-1.5 no-print"
        >
          <PackagePlus className="h-3.5 w-3.5" />
          <span>Add New Medication</span>
        </button>
      </PageTitle>

      <HospitalPrintHeader documentTitle="MAIN PHARMACY DRUG INVENTORY & STOCK VALUATION" />

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 no-print">
        <div className="card p-4 border-l-4 border-l-teal-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Formulations</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{medicines.length}</p>
          <p className="text-xs text-teal-700 font-medium mt-0.5">ASH Central Formulary</p>
        </div>

        <div
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`card p-4 cursor-pointer border-l-4 border-l-amber-500 transition-all ${
            lowStockOnly ? "ring-2 ring-amber-500 bg-amber-50/40" : "hover:border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Critical Reorder Alerts
            </p>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{lowStockCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {lowStockOnly ? "Click to view all items" : "Items at or below reorder point"}
          </p>
        </div>

        <div className="card p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Valuation</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            Rs {totalValue.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-700 font-medium mt-0.5">Wholesale Inventory Value</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9 text-xs"
            placeholder="Search medicine brand, generic name, category..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <select
            className="select text-xs max-w-[200px]"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Drug Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`btn text-xs py-2 px-3 whitespace-nowrap ${
              lowStockOnly
                ? "bg-amber-600 text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {lowStockOnly ? "Showing Low Stock" : "Filter Low Stock"}
          </button>
        </div>
      </div>

      {/* Medicine Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Drug Formulation</th>
                <th>Category / Form</th>
                <th>Current Stock</th>
                <th>Unit Price</th>
                <th>Expiry / Batch</th>
                <th>Manufacturer</th>
                <th className="no-print">Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const isLow = m.stock <= m.minStock;
                return (
                  <tr key={m.id} className={isLow ? "bg-amber-50/40" : ""}>
                    <td>
                      <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                      <p className="text-xs text-teal-800 font-medium">{m.genericName}</p>
                    </td>

                    <td>
                      <p className="text-xs font-semibold text-slate-700">{m.category}</p>
                      <span className="badge badge-gray text-[10px] mt-0.5">{m.dosageForm}</span>
                    </td>

                    <td>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-black text-sm px-2.5 py-1 rounded ${
                            isLow
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-50 text-emerald-900 border border-emerald-200"
                          }`}
                        >
                          {m.stock} {m.unit}
                        </span>
                        {isLow ? (
                          <span className="text-[10px] text-amber-800 font-bold bg-amber-200 px-1.5 py-0.5 rounded">
                            REORDER
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Min: {m.minStock} {m.unit}</p>
                    </td>

                    <td>
                      <p className="font-bold text-slate-900 font-mono text-sm">
                        Rs {m.price}
                      </p>
                      <p className="text-[10px] text-slate-400">per {m.unit}</p>
                    </td>

                    <td>
                      <p className="text-xs font-mono text-slate-700">{m.expiry}</p>
                      <p className="text-[11px] text-slate-400 font-mono">Lot: {m.batchNo}</p>
                    </td>

                    <td>
                      <p className="text-xs text-slate-600 font-medium">{m.manufacturer}</p>
                    </td>

                    <td className="no-print whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedMed(m);
                            setDispenseQty(1);
                            setDispenseError("");
                            setOpenDispenseModal(true);
                          }}
                          className="btn btn-primary text-xs py-1 px-2.5 bg-teal-700 hover:bg-teal-800 flex items-center gap-1"
                        >
                          <ArrowDownCircle className="h-3.5 w-3.5" />
                          <span>Dispense</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedMed(m);
                            setRestockQty(50);
                            setOpenRestockModal(true);
                          }}
                          className="btn btn-ghost text-xs py-1 px-2.5 text-slate-700 flex items-center gap-1"
                        >
                          <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Restock</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                    No medications found matching your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispense Modal */}
      {openDispenseModal && selectedMed ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={handleDispense}
            className="card p-6 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Dispense Medication</h3>
                  <p className="text-xs text-teal-700 font-semibold">{selectedMed.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenDispenseModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <p>
                  Available Stock:{" "}
                  <strong className="text-slate-900 font-mono">
                    {selectedMed.stock} {selectedMed.unit}
                  </strong>
                </p>
                <p>
                  Unit Retail Price:{" "}
                  <strong className="text-slate-900 font-mono">Rs {selectedMed.price}</strong>
                </p>
                <p>
                  Batch No: <span className="font-mono text-slate-600">{selectedMed.batchNo}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity to Dispense ({selectedMed.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedMed.stock}
                  className="input font-mono text-lg font-bold"
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(Number(e.target.value))}
                  required
                />
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900">Total Price:</span>
                <span className="text-lg font-black text-teal-900 font-mono">
                  Rs {(dispenseQty * selectedMed.price).toLocaleString()}
                </span>
              </div>

              {dispenseError ? (
                <p className="text-xs text-red-700 font-bold bg-red-50 p-2.5 rounded-lg border border-red-200">
                  ⚠️ {dispenseError}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpenDispenseModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Dispensing..." : "Confirm Dispense & Deduct Stock"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Restock Modal */}
      {openRestockModal && selectedMed ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={handleRestock}
            className="card p-6 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Stock Inward / Restock</h3>
                  <p className="text-xs text-teal-700 font-semibold">{selectedMed.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenRestockModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Received Quantity (+ {selectedMed.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  className="input font-mono text-lg font-bold"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  required
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                <p className="text-emerald-900">
                  New Total Stock will be:{" "}
                  <strong className="font-mono text-sm">
                    {selectedMed.stock + restockQty} {selectedMed.unit}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpenRestockModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary bg-emerald-700 hover:bg-emerald-800"
                disabled={loading}
              >
                {loading ? "Updating..." : "Add to Stock Inventory"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Add New Formulation Modal */}
      {openAddModal ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <form
            onSubmit={createMedicine}
            className="card p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-lg text-slate-900">Add New Pharmaceutical Item</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brand Name & Strength <span className="text-red-600">*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. Augmentin 625mg"
                  value={drugForm.name}
                  onChange={(e) => setDrugForm({ ...drugForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Generic Formula
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Amoxicillin + Clavulanate"
                    value={drugForm.genericName}
                    onChange={(e) => setDrugForm({ ...drugForm, genericName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Therapeutic Category
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Antibiotics, NSAID, Cardiac"
                    value={drugForm.category}
                    onChange={(e) => setDrugForm({ ...drugForm, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dosage Form</label>
                  <input
                    className="input"
                    placeholder="Tablet, Syrup, Injection"
                    value={drugForm.dosageForm}
                    onChange={(e) => setDrugForm({ ...drugForm, dosageForm: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    className="input font-mono"
                    value={drugForm.stock}
                    onChange={(e) => setDrugForm({ ...drugForm, stock: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price (Rs)</label>
                  <input
                    type="number"
                    className="input font-mono"
                    value={drugForm.price}
                    onChange={(e) => setDrugForm({ ...drugForm, price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Reorder</label>
                  <input
                    type="number"
                    className="input font-mono"
                    value={drugForm.minStock}
                    onChange={(e) => setDrugForm({ ...drugForm, minStock: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    className="input"
                    value={drugForm.expiry}
                    onChange={(e) => setDrugForm({ ...drugForm, expiry: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch / Lot #</label>
                  <input
                    className="input font-mono"
                    value={drugForm.batchNo}
                    onChange={(e) => setDrugForm({ ...drugForm, batchNo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Manufacturer / Supplier
                </label>
                <input
                  className="input"
                  placeholder="e.g. GSK Pakistan Ltd, Getz Pharma, Pfizer"
                  value={drugForm.manufacturer}
                  onChange={(e) => setDrugForm({ ...drugForm, manufacturer: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Adding..." : "Add to Pharmacy Inventory"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
