"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { Customer, Plan } from "@/lib/types";

interface Props {
  customers: Customer[];
  plans: Plan[];
  loading: boolean;
  form: { customerId: string; planId: string };
  onChange: (form: { customerId: string; planId: string }) => void;
  creating: boolean;
  onClose: () => void;
  onCreate: () => void;
}

export default function NewSubscriptionModal({ customers, plans, loading, form, onChange, creating, onClose, onCreate }: Props) {
  return (
    <Modal title="New Subscription" onClose={onClose}>
      {loading ? (
        <div className="py-8 flex items-center justify-center">
          <p className="font-mono text-[12px] text-label-3">Loading...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-label-3 block mb-1.5">Customer</span>
            {customers.length === 0 ? (
              <p className="font-mono text-[11px] text-red">No customers yet - add one first.</p>
            ) : (
              <select
                value={form.customerId}
                onChange={e => onChange({ ...form, customerId: e.target.value })}
                className="w-full bg-surface-2 border border-stroke rounded-lg px-3 py-2.5 font-sans text-[13px] text-label focus:outline-none focus:border-yellow"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.email}</option>
                ))}
              </select>
            )}
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-label-3 block mb-1.5">Plan</span>
            {plans.length === 0 ? (
              <p className="font-mono text-[11px] text-red">No active plans - create one first.</p>
            ) : (
              <select
                value={form.planId}
                onChange={e => onChange({ ...form, planId: e.target.value })}
                className="w-full bg-surface-2 border border-stroke rounded-lg px-3 py-2.5 font-sans text-[13px] text-label focus:outline-none focus:border-yellow"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {p.interval.toLowerCase()}</option>
                ))}
              </select>
            )}
          </label>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 mt-6">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={onCreate}>
          {creating ? "Creating..." : "Create Subscription"}
        </Button>
      </div>
    </Modal>
  );
}
