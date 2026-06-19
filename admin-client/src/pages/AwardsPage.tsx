import { FormEvent, useEffect, useState } from "react";
import { api, type Award, type CreateAwardInput } from "../api/client";
import { translateAwardType, useI18n } from "../i18n/I18nContext";

const emptyForm: CreateAwardInput = {
  award_type: "points",
  award_value: "",
  percentage: 0,
  award_description: "",
};

export function AwardsPage() {
  const { t } = useI18n();
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
      setError(err instanceof Error ? err.message : t("awards.loadFailed"));
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
      setError(err instanceof Error ? err.message : t("awards.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="page-title">{t("awards.title")}</h2>
          <p className="mt-1 text-sm text-brand-700/70">{t("awards.subtitle")}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          {t("awards.add")}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-brand-200/60 bg-white p-6 shadow-sm"
        >
          <h3 className="font-semibold text-brand-900">
            {editing ? t("awards.editTitle") : t("awards.newTitle")}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t("awards.type")}
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
                <option value="points">{t("awards.typePoints")}</option>
                <option value="discount">{t("awards.typeDiscount")}</option>
                <option value="physical">{t("awards.typePhysical")}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t("awards.value")}
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
                {t("awards.percentage")}
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
                {t("awards.description")}
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
              className="btn-primary disabled:opacity-60"
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="card-surface mt-6">
        <table className="min-w-full divide-y divide-brand-100 text-sm">
          <thead className="bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("awards.colId")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("awards.colType")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("awards.colValue")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("awards.colWeight")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("awards.colDescription")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {awards.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {t("awards.noAwards")}
                </td>
              </tr>
            ) : (
              awards.map((award) => (
                <tr key={award.award_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{award.award_id}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {translateAwardType(award.award_type, t)}
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
                      className="text-sm font-medium text-brand-600 hover:text-brand-800"
                    >
                      {t("common.edit")}
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
