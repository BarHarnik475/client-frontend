import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";

function ClientListPage() {
  const [clients, setClients] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ name: "", phone: "" });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const nameRef = useRef(null);
  const phoneRef = useRef(null);

  async function loadClients() {
    try {
      const url = searchTerm
        ? `http://localhost:5000/clients?search=${searchTerm}`
        : "http://localhost:5000/clients";

      const res = await apiFetch(url);
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.log("Failed to load clients:", err);
    }
  }

  useEffect(() => {
    loadClients();
  }, [searchTerm]);

  async function handleAddClient() {
    const newClient = {
      name: nameRef.current.value,
      phone: phoneRef.current.value,
    };
    try {
      await apiFetch("http://localhost:5000/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      loadClients();
    } catch (err) {
      console.log("Failed to add client:", err);
    }
  }

  async function handleDeleteClient(id) {
    try {
      const res = await apiFetch(`http://localhost:5000/clients/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Failed to delete client.");
        return;
      }

      setError(null);
      loadClients();
    } catch (err) {
      console.log("Failed to delete client:", err);
    }
  }

  async function handleSaveEdit(id) {
    try {
      await apiFetch(`http://localhost:5000/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      setEditingId(null);
      loadClients();
    } catch (err) {
      console.log("Failed to update client:", err);
    }
  }

  const inputClass =
    "border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Clients</h1>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4">
          {error}
        </p>
      )}

      <div className="mb-6">
        <input
          className={`${inputClass} w-full max-w-sm`}
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input className={inputClass} placeholder="Name" ref={nameRef} />
        <input className={inputClass} placeholder="Phone" ref={phoneRef} />
        <button
          onClick={handleAddClient}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md"
        >
          Add Client
        </button>
      </div>

      <ul className="divide-y divide-slate-200 border-t border-slate-200">
        {clients.map((c) =>
          editingId === c.id ? (
            <li key={c.id} className="flex flex-wrap items-center gap-2 py-4">
              <input
                className={inputClass}
                value={editValues.name}
                onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
              />
              <input
                className={inputClass}
                value={editValues.phone}
                onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
              />
              <button
                onClick={() => handleSaveEdit(c.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-md"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium px-3 py-1.5 rounded-md"
              >
                Cancel
              </button>
            </li>
          ) : (
            <li key={c.id} className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3 text-sm text-slate-600 min-w-0">
                <Link
                  to={`/clients/${c.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {c.name}
                </Link>
                <span className="text-slate-400">—</span>
                <span>{c.phone}</span>
                <span className="text-slate-400">—</span>
                <span>{c.status}</span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { setEditingId(c.id); setEditValues({ name: c.name, phone: c.phone }); }}
                  className="border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium px-3 py-1.5 rounded-md"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClient(c.id)}
                  className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-sm font-medium px-3 py-1.5 rounded-md"
                >
                  Delete
                </button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

export default ClientListPage;