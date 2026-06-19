import { FormEvent, useEffect, useState } from "react";
import { api, type Agent, type CreateAgentInput } from "../api/client";
import { useI18n } from "../i18n/I18nContext";

const emptyForm: CreateAgentInput = {
  agent_name: "",
  agent_logo: "",
  agent_primary_color: "",
};

export function AgentsPage() {
  const { t } = useI18n();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [form, setForm] = useState<CreateAgentInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await api.getAgents();
      setAgents(res.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("agents.loadFailed"));
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

  function openEdit(agent: Agent) {
    setEditing(agent);
    setForm({
      agent_name: agent.agent_name,
      agent_logo: agent.agent_logo ?? "",
      agent_primary_color: agent.agent_primary_color ?? "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.updateAgent(editing.agent_id, form);
      } else {
        await api.createAgent(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("agents.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="page-title">{t("agents.title")}</h2>
          <p className="mt-1 text-sm text-brand-700/70">{t("agents.subtitle")}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          {t("agents.add")}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-brand-200/60 bg-white p-6 shadow-sm"
        >
          <h3 className="font-semibold text-brand-900">
            {editing ? t("agents.editTitle") : t("agents.newTitle")}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t("agents.name")}
              </label>
              <input
                value={form.agent_name}
                onChange={(e) => setForm({ ...form, agent_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t("agents.logoUrl")}
              </label>
              <input
                value={form.agent_logo}
                onChange={(e) => setForm({ ...form, agent_logo: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                dir="ltr"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t("agents.primaryColor")}
              </label>
              <input
                value={form.agent_primary_color}
                onChange={(e) =>
                  setForm({ ...form, agent_primary_color: e.target.value })
                }
                placeholder={t("agents.colorPlaceholder")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                dir="ltr"
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.length === 0 ? (
          <p className="col-span-full rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-400">
            {t("agents.noAgents")}
          </p>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.agent_id}
              className="rounded-xl border border-brand-200/60 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-brand-900">
                    {agent.agent_name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {t("agents.idLabel", { id: agent.agent_id })}
                  </p>
                </div>
                {agent.agent_primary_color && (
                  <div
                    className="h-8 w-8 rounded-lg border border-slate-200"
                    style={{ backgroundColor: agent.agent_primary_color }}
                  />
                )}
              </div>
              {agent.agent_logo && (
                <p className="mt-3 truncate text-xs text-slate-500" dir="ltr">
                  {agent.agent_logo}
                </p>
              )}
              <button
                onClick={() => openEdit(agent)}
                className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-800"
              >
                {t("common.edit")}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
