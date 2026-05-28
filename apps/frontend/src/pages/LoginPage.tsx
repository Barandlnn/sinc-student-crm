import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabaseClient";

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("manager@sinc.test");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-8">
          <p className="text-sm text-slate-400">Student CRM</p>
          <h1 className="mt-2 text-3xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-slate-400">
            Log in as manager, sales, or client.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email
            </label>

            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="manager@sinc.test"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>

            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          <button
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-950 p-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Demo users:</p>
          <p>manager@sinc.test</p>
          <p>sales1@sinc.test</p>
          <p>sales2@sinc.test</p>
          <p>client1@sinc.test</p>
        </div>
      </section>
    </main>
  );
}