export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">SINC Sales CRM</h1>
        <p className="mt-2 text-sm text-slate-600">
          Login screen will be connected to Supabase Auth.
        </p>

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Email"
          />
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Password"
            type="password"
          />
          <button className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white">
            Login
          </button>
        </div>
      </div>
    </div>
  );
}