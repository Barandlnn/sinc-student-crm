import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "@/lib/auth";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/clients", label: "Clients" },
  { to: "/conversations", label: "Conversations" },
  { to: "/pipeline", label: "Pipeline" },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="text-xl font-bold">
            SINC Sales CRM
          </Link>

          <div className="flex items-center gap-3">
            <input
              className="w-64 rounded-lg border px-3 py-2 text-sm"
              placeholder="Search..."
            />

            <div className="flex items-center gap-3 rounded-xl border px-3 py-2">
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {profile?.full_name ?? "User"}
                </p>
                <p className="text-xs capitalize text-slate-500">
                  {profile?.role ?? "unknown"}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-2 px-6 pb-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}