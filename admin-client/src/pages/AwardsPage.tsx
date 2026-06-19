import { FormEvent, useEffect, useState } from "react";
import { api, type Award, type CreateAwardInput } from "../api/client";

const emptyForm: CreateAwardInput = {
  award_type: "points",
  award_value: "",
  percentage: 0,
  award_description: "",
};

export function AwardsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Award | null>(null);
  const [form, setForm] = useState<CreateAwardInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await api.getAwards();
      setAwards(res.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load awards");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(award: Award) {
    setEditing(award);
    setForm({
      award_type: award.award_type,
      award_value: award.award_value,
      percentage: award.percentage,
      award_description: award.award_description,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.updateAward(editing.award_id, form);
      } else {
        await api.createAward(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Awards</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage prize types and values
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Add Award
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900">
            {editing ? "Edit Award" : "New Award"}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Type
              </label>
              <select
                value={form.award_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    award_type: e.target.value as CreateAwardInput["award_type"],
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="points">Points</option>
                <option value="discount">Discount</option>
                <option value="physical">Physical</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Value
              </label>
              <input
                value={form.award_value}
                onChange={(e) => setForm({ ...form, award_value: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Percentage (weight)
              </label>
              <input
                type="number"
                min={0}
                value={form.percentage}
                onChange={(e) =>
                  setForm({ ...form, percentage: parseFloat(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Description
              </label>
              <input
                value={form.award_description}
                onChange={(e) =>
                  setForm({ ...form, award_description: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">ID</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Type</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Value</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Weight %</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Description</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {awards.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No awards configured
                </td>
              </tr>
            ) : (
              awards.map((award) => (
                <tr key={award.award_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{award.award_id}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {award.award_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{award.award_value}</td>
                  <td className="px-4 py-3">{award.percentage}%</td>
                  <td className="px-4 py-3 text-slate-600">
                    {award.award_description}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(award)}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
