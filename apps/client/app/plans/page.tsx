"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Archive, Layers, TrendingUp, Users, Star } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { SkeletonTable, ErrorState } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { Plan } from "@/lib/types";
import { fmt, intervalLabel } from "@/lib/utils";

type PlanInterval = "MONTHLY" | "ANNUAL" | "CUSTOM";

const COLS    = "grid-cols-[2fr_1fr_1fr_1fr_1fr_72px]";
const HEADERS = ["Plan Name", "Price", "Interval", "Trial", "Status", "Actions"];

type PlanForm = { name: string; amount: string; interval: PlanInterval; trialDays: string };

const emptyForm: PlanForm = { name: "", amount: "", interval: "MONTHLY", trialDays: "0" };

function PlanFormFields({
  form,
  onChange,
}: {
  form: PlanForm;
  onChange: (f: PlanForm) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-widest text-label-3 block mb-1.5">Plan Name</span>
        <input
          value={form.name}
          onChange={e => onChange({ ...form, name: e.target.value })}
          className="w-full bg-surface-2 border border-stroke rounded-lg px-3 py-2.5 font-sans text-[13px] text-label placeholder:text-label-3 focus:outline-none focus:border-yellow"
          placeholder="e.g. Pro Monthly"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-widest text-label-3 block mb-1.5">Amount (NGN)</span>
        <input
          type="number"
          value={form.amount}
          onChange={e => onChange({ ...form, amount: e.target.value })}
          className="w-full bg-surface-2 border border-stroke rounded-lg px-3 py-2.5 font-mono text-[13px] text-label placeholder:text-label-3 focus:outline-none focus:border-yellow"
          placeholder="24000"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-widest text-label-3 block mb-1.5">Interval</span>
        <select
          value={form.interval}
          onChange={e => onChange({ ...form, interval: e.target.value as PlanInterval })}
          className="w-full bg-surface-2 border border-stroke rounded-lg px-3 py-2.5 font-sans text-[13px] text-label focus:outline-none focus:border-yellow"
        >
          <option value="MONTHLY">Monthly</option>
          <option value="ANNUAL">Annual</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-widest text-label-3 block mb-1.5">Trial Days</span>
        <input
          type="number"
          value={form.trialDays}
          onChange={e => onChange({ ...form, trialDays: e.target.value })}
          className="w-full bg-surface-2 border border-stroke rounded-lg px-3 py-2.5 font-mono text-[13px] text-label placeholder:text-label-3 focus:outline-none focus:border-yellow"
          placeholder="0"
        />
      </label>
    </div>
  );
}

export default function PlansPage() {
  const [plans,      setPlans]      = useState<Plan[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<PlanForm>(emptyForm);
  const [creating,   setCreating]   = useState(false);

  const [editPlan,  setEditPlan]  = useState<Plan | null>(null);
  const [editForm,  setEditForm]  = useState<PlanForm>(emptyForm);
  const [updating,  setUpdating]  = useState(false);

  const [archiving,    setArchiving]    = useState<string | null>(null);
  const [archiveArmed, setArchiveArmed] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet<Plan[]>("/api/v1/plans")
      .then(setPlans)
      .catch(err => setError((err as Error).message ?? "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!createForm.name.trim() || !createForm.amount) return;
    setCreating(true);
    try {
      await apiPost<Plan>("/api/v1/plans", {
        name:      createForm.name.trim(),
        amount:    parseInt(createForm.amount, 10),
        interval:  createForm.interval,
        trialDays: parseInt(createForm.trialDays, 10) || 0,
      });
      setShowCreate(false);
      setCreateForm(emptyForm);
      load();
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to create plan");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(plan: Plan) {
    setEditPlan(plan);
    setEditForm({
      name:      plan.name,
      amount:    String(plan.amount),
      interval:  plan.interval,
      trialDays: String(plan.trialDays),
    });
  }

  async function handleUpdate() {
    if (!editPlan) return;
    setUpdating(true);
    try {
      await apiPatch<Plan>(`/api/v1/plans/${editPlan.id}`, {
        name:      editForm.name.trim(),
        amount:    parseInt(editForm.amount, 10),
        interval:  editForm.interval,
        trialDays: parseInt(editForm.trialDays, 10) || 0,
      });
      setEditPlan(null);
      load();
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to update plan");
    } finally {
      setUpdating(false);
    }
  }

  async function handleArchive(id: string) {
    if (archiveArmed !== id) {
      setArchiveArmed(id);
      setTimeout(() => setArchiveArmed(a => a === id ? null : a), 3000);
      return;
    }
    setArchiveArmed(null);
    setArchiving(id);
    try {
      await apiDelete(`/api/v1/plans/${id}`);
      load();
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to archive plan");
    } finally {
      setArchiving(null);
    }
  }

  const activePlans = plans.filter(p => p.isActive).length;
  const avgValue    = plans.length > 0
    ? Math.round(plans.reduce((s, p) => s + p.amount, 0) / plans.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] text-label-3 uppercase tracking-widest">
          {loading ? "—" : `${plans.length} plans total`}
        </p>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={12} /> New Plan
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Plans"    value={loading ? "—" : String(plans.length)} icon={<Layers size={16} />} />
        <StatCard label="Active Plans"   value={loading ? "—" : String(activePlans)}  icon={<TrendingUp size={16} />} />
        <StatCard label="Avg Plan Value" value={loading ? "—" : fmt(avgValue)}         icon={<Star size={16} />} />
        <StatCard label="Plans Online"   value={loading ? "—" : String(activePlans)}   icon={<Users size={16} />} highlight />
      </div>

      <Card title="All Plans" noPadding>
        <div className={`grid ${COLS} gap-4 px-5 py-3 bg-surface-2 border-b border-stroke`}>
          {HEADERS.map(h => (
            <span key={h} className="font-mono text-[10px] uppercase tracking-widest text-label-2">{h}</span>
          ))}
        </div>

        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Layers size={28} className="text-label-3 mb-3" />
            <p className="font-sans text-[14px] text-label-2 mb-1">No plans yet</p>
            <p className="font-mono text-[11px] text-label-3">Create your first plan to start billing customers.</p>
          </div>
        ) : (
          plans.map(plan => (
            <div key={plan.id} className={`grid ${COLS} gap-4 px-5 py-[14px] hover:bg-surface-2 transition-colors cursor-default`}>
              <div className="min-w-0">
                <p className="font-sans text-[13px] font-medium text-label truncate">{plan.name}</p>
                <p className="font-mono text-[10px] text-label-3">{plan.id}</p>
              </div>
              <div className="flex items-center">
                <span className="font-mono text-[13px] text-label">{fmt(plan.amount)}</span>
              </div>
              <div className="flex items-center">
                <span className="font-mono text-[11px] text-label-2">{intervalLabel(plan.interval)}</span>
              </div>
              <div className="flex items-center">
                <span className="font-mono text-[11px] text-label-2">
                  {plan.trialDays > 0 ? `${plan.trialDays}d` : "—"}
                </span>
              </div>
              <div className="flex items-center">
                <Badge
                  variant={plan.isActive ? "active" : "cancelled"}
                  label={plan.isActive ? "Active" : "Inactive"}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEdit(plan)}
                  className="p-1.5 rounded-lg hover:bg-surface-3 text-label-3 hover:text-label transition-colors"
                  title="Edit"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleArchive(plan.id)}
                  disabled={archiving === plan.id}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${archiveArmed === plan.id ? "bg-red/10 text-red" : "hover:bg-surface-3 text-label-3 hover:text-red"}`}
                  title={archiveArmed === plan.id ? "Click again to confirm" : "Archive"}
                >
                  <Archive size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </Card>

      {showCreate && (
        <Modal title="New Plan" onClose={() => setShowCreate(false)}>
          <PlanFormFields form={createForm} onChange={setCreateForm} />
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create Plan"}
            </Button>
          </div>
        </Modal>
      )}

      {editPlan && (
        <Modal title="Edit Plan" onClose={() => setEditPlan(null)}>
          <PlanFormFields form={editForm} onChange={setEditForm} />
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="ghost" size="sm" onClick={() => setEditPlan(null)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleUpdate} disabled={updating}>
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
