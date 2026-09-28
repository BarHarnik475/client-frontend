import { Link, useNavigate } from "react-router-dom";

function Layout({ children }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex gap-6">
          <Link to="/" className="font-semibold hover:text-blue-300">Clients</Link>
          <Link to="/dashboard" className="font-semibold hover:text-blue-300">Dashboard</Link>
        </div>
        <button
          onClick={handleLogout}
          className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded"
        >
          Log Out
        </button>
      </nav>

      <main className="p-8">{children}</main>
    </div>
  );
}

export default Layout;