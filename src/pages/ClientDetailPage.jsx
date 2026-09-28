import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api";

function getTaskUrgency(dueDate) {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (due < today) return "overdue";
  if (due.getTime() === tomorrow.getTime()) return "urgent";
  return "upcoming";
}

const TASK_URGENCY_STYLES = {
  overdue: {
    card: "bg-red-50 border-red-200",
    text: "text-red-700",
  },
  urgent: {
    card: "bg-orange-50 border-orange-200",
    text: "text-orange-700",
  },
  upcoming: {
    card: "bg-amber-50 border-amber-200",
    text: "text-slate-700",
  },
};

function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [notes, setNotes] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [carriers, setCarriers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [showClaims, setShowClaims] = useState({});
  const [claims, setClaims] = useState({});
  const [newClaimValues, setNewClaimValues] = useState({});
  const providerRef = useRef(null);
  const policyTypeRef = useRef(null);
  const premiumRef = useRef(null);
  const startDateRef = useRef(null);
  const renewalDateRef = useRef(null);
  const noteContentRef = useRef(null);
  const taskContentRef = useRef(null);
  const taskDueDateRef = useRef(null);

  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [editPolicyValues, setEditPolicyValues] = useState({
    provider: "",
    policyType: "",
    premium: "",
    startDate: "",
    renewalDate: "",
  });

  async function loadPolicies() {
    const res = await apiFetch(`http://localhost:5000/clients/${id}/policies`);
    const data = await res.json();
    setPolicies(data);
  }

  async function loadNotes() {
    const res = await apiFetch(`http://localhost:5000/clients/${id}/notes`);
    const data = await res.json();
    setNotes(data);
  }

  async function loadTasks() {
    const res = await apiFetch(`http://localhost:5000/clients/${id}/tasks`);
    const data = await res.json();
    setTasks(data);
  }

  async function loadClaims(policyId) {
    const res = await apiFetch(
      `http://localhost:5000/policies/${policyId}/claims`,
    );
    const data = await res.json();
    setClaims((prev) => ({ ...prev, [policyId]: data }));
  }

  function toggleClaims(policyId) {
    const isShowing = !!showClaims[policyId];
    setShowClaims({ ...showClaims, [policyId]: !isShowing });
    if (!isShowing) loadClaims(policyId);
  }

  function updateNewClaimValue(policyId, field, value) {
    setNewClaimValues({
      ...newClaimValues,
      [policyId]: { ...newClaimValues[policyId], [field]: value },
    });
  }

  useEffect(() => {
    async function loadClient() {
      const res = await apiFetch(`http://localhost:5000/clients/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setClient(data);
    }

    async function loadCarriers() {
      const res = await apiFetch("http://localhost:5000/carriers");
      const data = await res.json();
      setCarriers(data);
    }

    loadClient();
    loadCarriers();
    loadPolicies();
    loadNotes();
    loadTasks();
  }, [id]);

  async function handleAddPolicy() {
    const provider = providerRef.current.value;
    const policyType = policyTypeRef.current.value;
    const premium = parseFloat(premiumRef.current.value);
    const startDate = startDateRef.current.value;
    const renewalDate = renewalDateRef.current.value;

    if (
      !provider ||
      !policyType ||
      !startDate ||
      !renewalDate ||
      isNaN(premium)
    ) {
      setError("Please fill in all fields with a valid premium amount.");
      return;
    }

    const newPolicy = { provider, policyType, premium, startDate, renewalDate };
    try {
      const res = await apiFetch(
        `http://localhost:5000/clients/${id}/policies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPolicy),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Failed to add policy.");
        return;
      }

      setError(null);
      loadPolicies();
    } catch (err) {
      console.log("Failed to add policy:", err);
    }
  }

  async function handleDeletePolicy(policyId) {
    try {
      const res = await apiFetch(`http://localhost:5000/policies/${policyId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Failed to delete policy.");
        return;
      }

      setError(null);
      loadPolicies();
    } catch (err) {
      console.log("Failed to delete policy:", err);
    }
  }

  async function handleAddNote() {
    const content = noteContentRef.current.value;

    if (!content.trim()) {
      setError("Note content can't be empty.");
      return;
    }

    try {
      const res = await apiFetch(`http://localhost:5000/clients/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Failed to add note.");
        return;
      }

      setError(null);
      noteContentRef.current.value = "";
      loadNotes();
    } catch (err) {
      console.log("Failed to add note:", err);
    }
  }

  function startEditingPolicy(p) {
    setEditingPolicyId(p.id);
    setEditPolicyValues({
      provider: p.provider,
      policyType: p.policyType,
      premium: p.premium,
      startDate: p.startDate?.slice(0, 10) ?? "",
      renewalDate: p.renewalDate?.slice(0, 10) ?? "",
    });
  }

  async function handleSavePolicyEdit(policyId) {
    const { provider, policyType, premium, startDate, renewalDate } =
      editPolicyValues;
    const parsedPremium = parseFloat(premium);

    if (
      !provider ||
      !policyType ||
      !startDate ||
      !renewalDate ||
      isNaN(parsedPremium)
    ) {
      setError("Please fill in all fields with a valid premium amount.");
      return;
    }

    try {
      const res = await apiFetch(`http://localhost:5000/policies/${policyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          policyType,
          premium: parsedPremium,
          startDate,
          renewalDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Failed to edit policy.");
        return;
      }

      setError(null);
      setEditingPolicyId(null);
      loadPolicies();
    } catch (err) {
      console.log("Failed to edit policy:", err);
    }
  }

  async function handleAddTask() {
    const content = taskContentRef.current.value;
    const dueDate = taskDueDateRef.current.value;

    if (!content.trim() || !dueDate) {
      setError("Task needs both content and a due date.");
      return;
    }

    try {
      const res = await apiFetch(`http://localhost:5000/clients/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, dueDate }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Failed to add task.");
        return;
      }

      setError(null);
      taskContentRef.current.value = "";
      taskDueDateRef.current.value = "";
      loadTasks();
    } catch (err) {
      console.log("Failed to add task:", err);
    }
  }

  async function handleCompleteTask(taskId) {
    try {
      const res = await apiFetch(
        `http://localhost:5000/tasks/${taskId}/completed`,
        {
          method: "PUT",
        },
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Failed to complete task.");
        return;
      }

      setError(null);
      loadTasks();
    } catch (err) {
      console.log("Failed to complete task:", err);
    }
  }

  async function handleAddClaim(policyId) {
    const values = newClaimValues[policyId] ?? {};
    const claimDate = values.claimDate;
    const description = values.description ?? "";
    const amount = parseFloat(values.amount);

    if (!claimDate || !description.trim() || isNaN(amount)) {
      setError("Please fill in all claim fields with a valid amount.");
      return;
    }

    try {
      const res = await apiFetch(
        `http://localhost:5000/policies/${policyId}/claims`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claimDate, description, amount }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Failed to add claim.");
        return;
      }

      setError(null);
      setNewClaimValues({ ...newClaimValues, [policyId]: {} });
      loadClaims(policyId);
    } catch (err) {
      console.log("Failed to add claim:", err);
    }
  }

  async function handleChangeStatus(newStatus) {
    try {
      const res = await apiFetch(`http://localhost:5000/clients/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setError("Failed to update status.");
        return;
      }

      setError(null);
      setClient({ ...client, status: newStatus });
    } catch (err) {
      console.log("Failed to update status:", err);
    }
  }

  if (notFound) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-slate-500">Client not found.</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const inputClass =
    "border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-slate-800">{client.name}</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">{client.phone}</p>
      <select
        value={client.status}
        onChange={(e) => handleChangeStatus(e.target.value)}
        className="inline-block bg-blue-50 border border-blue-200 text-blue-600 text-xs font-medium px-3 py-1 rounded-full mb-4"
      >
        <option value="Lead">Lead</option>
        <option value="Quoted">Quoted</option>
        <option value="Bound">Bound</option>
        <option value="Lost">Lost</option>
      </select>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4">
          {error}
        </p>
      )}

      <div className="mb-6 pb-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Notes</h2>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 text-sm font-medium px-3 py-1.5 rounded-md mb-3"
        >
          {showNotes ? "Hide all notes" : "Show all notes"}
        </button>
        {showNotes && (
          <ul className="space-y-2 mb-4">
            {notes.map((n) => (
              <li
                key={n.id}
                className="bg-slate-50 border border-slate-200 rounded-md px-4 py-3"
              >
                <p className="text-sm text-slate-700">{n.content}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-3">
          <textarea
            className={`${inputClass} flex-1`}
            placeholder="Add a note..."
            ref={noteContentRef}
            rows={2}
          />
          <button
            onClick={handleAddNote}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md self-start"
          >
            Add Note
          </button>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mb-3">Policies</h2>
      <ul className="space-y-2">
        {policies.map((p) =>
          editingPolicyId === p.id ? (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-4 py-3"
            >
              <select
                className={inputClass}
                value={editPolicyValues.provider}
                onChange={(e) =>
                  setEditPolicyValues({
                    ...editPolicyValues,
                    provider: e.target.value,
                  })
                }
              >
                {carriers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                placeholder="Policy Type"
                value={editPolicyValues.policyType}
                onChange={(e) =>
                  setEditPolicyValues({
                    ...editPolicyValues,
                    policyType: e.target.value,
                  })
                }
              />
              <input
                className={inputClass}
                type="number"
                placeholder="Premium"
                value={editPolicyValues.premium}
                onChange={(e) =>
                  setEditPolicyValues({
                    ...editPolicyValues,
                    premium: e.target.value,
                  })
                }
              />
              <input
                className={inputClass}
                type="date"
                value={editPolicyValues.startDate}
                onChange={(e) =>
                  setEditPolicyValues({
                    ...editPolicyValues,
                    startDate: e.target.value,
                  })
                }
              />
              <input
                className={inputClass}
                type="date"
                value={editPolicyValues.renewalDate}
                onChange={(e) =>
                  setEditPolicyValues({
                    ...editPolicyValues,
                    renewalDate: e.target.value,
                  })
                }
              />
              <button
                onClick={() => handleSavePolicyEdit(p.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-md"
              >
                Save
              </button>
              <button
                onClick={() => setEditingPolicyId(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-md"
              >
                Cancel
              </button>
            </li>
          ) : (
            <li
              key={p.id}
              className="bg-slate-50 border border-slate-200 rounded-md px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{p.provider}</p>
                  <p className="text-sm text-slate-500">{p.policyType}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-blue-600">${p.premium}</p>
                  <button
                    onClick={() => toggleClaims(p.id)}
                    className="bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 text-sm font-medium px-3 py-1.5 rounded-md"
                  >
                    {showClaims[p.id] ? "Hide Claims" : "Show Claims"}
                  </button>
                  <button
                    onClick={() => startEditingPolicy(p)}
                    className="bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 text-sm font-medium px-3 py-1.5 rounded-md"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePolicy(p.id)}
                    className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-sm font-medium px-3 py-1.5 rounded-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {showClaims[p.id] && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <ul className="space-y-2 mb-3">
                    {(claims[p.id] ?? []).map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-4 py-3"
                      >
                        <div>
                          <p className="text-sm text-slate-700">
                            {c.description}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(c.claimDate).toLocaleDateString()} ·{" "}
                            {c.status}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-700">
                          ${c.amount}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <input
                      className={inputClass}
                      type="date"
                      value={newClaimValues[p.id]?.claimDate ?? ""}
                      onChange={(e) =>
                        updateNewClaimValue(p.id, "claimDate", e.target.value)
                      }
                    />
                    <input
                      className={`${inputClass} flex-1`}
                      placeholder="Claim description..."
                      value={newClaimValues[p.id]?.description ?? ""}
                      onChange={(e) =>
                        updateNewClaimValue(p.id, "description", e.target.value)
                      }
                    />
                    <input
                      className={inputClass}
                      type="number"
                      placeholder="Amount"
                      value={newClaimValues[p.id]?.amount ?? ""}
                      onChange={(e) =>
                        updateNewClaimValue(p.id, "amount", e.target.value)
                      }
                    />
                    <button
                      onClick={() => handleAddClaim(p.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-md"
                    >
                      Add Claim
                    </button>
                  </div>
                </div>
              )}
            </li>
          ),
        )}
      </ul>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Add Policy
        </h2>
        <div className="flex flex-wrap gap-3">
          <select className={inputClass} ref={providerRef}>
            <option value="">Select a carrier...</option>
            {carriers.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder="Policy Type"
            ref={policyTypeRef}
          />
          <input
            className={inputClass}
            type="number"
            placeholder="Premium"
            ref={premiumRef}
          />
          <input className={inputClass} type="date" ref={startDateRef} />
          <input className={inputClass} type="date" ref={renewalDateRef} />
          <button
            onClick={handleAddPolicy}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md"
          >
            Add Policy
          </button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Tasks</h2>
        <ul className="space-y-2 mb-4">
          {tasks
            .filter((t) => !t.completed)
            .map((t) => {
              const urgency = getTaskUrgency(t.dueDate);
              const styles = TASK_URGENCY_STYLES[urgency];
              return (
                <li
                  key={t.id}
                  className={`flex items-center justify-between border rounded-md px-4 py-3 ${styles.card}`}
                >
                  <div>
                    <p className={`text-sm ${styles.text}`}>{t.content}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Due {new Date(t.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCompleteTask(t.id)}
                    className="bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 text-sm font-medium px-3 py-1.5 rounded-md"
                  >
                    Mark Complete
                  </button>
                </li>
              );
            })}
        </ul>
        <div className="flex gap-3">
          <input
            className={`${inputClass} flex-1`}
            placeholder="Task description..."
            ref={taskContentRef}
          />
          <input className={inputClass} type="date" ref={taskDueDateRef} />
          <button
            onClick={handleAddTask}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClientDetailPage;
