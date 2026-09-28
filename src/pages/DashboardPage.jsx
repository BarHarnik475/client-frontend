import { useEffect, useState } from "react";
import { apiFetch } from "../api";

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      const res = await apiFetch("http://localhost:5000/dashboard");
      const data = await res.json();
      setDashboard(data);
    }

    loadDashboard();
  }, []);

  if (!dashboard) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500 mb-1">Total Clients</p>
          <p className="text-3xl font-bold text-blue-600">{dashboard.totalClients}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500 mb-1">Total Policies</p>
          <p className="text-3xl font-bold text-blue-600">{dashboard.totalPolicies}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mb-3">Upcoming Renewals</h2>
      <ul className="space-y-2">
        {dashboard.upcomingRenewals.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-4 py-3"
          >
            <div>
              <p className="font-medium text-slate-800">{item.provider}</p>
              <p className="text-sm text-slate-500">{item.policyType}</p>
            </div>
            <p className="text-sm text-slate-500">{new Date(item.renewalDate).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DashboardPage;
