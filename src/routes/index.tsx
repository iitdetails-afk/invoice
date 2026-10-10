import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

const ADMIN_PIN = "123456"; // 6-digit admin pin to change details

function LoginPage() {
  const navigate = useNavigate();
  // Login standard state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Stored credentials state
  const [storedUsername, setStoredUsername] = useState("admin");
  const [storedPassword, setStoredPassword] = useState("admin123");

  // Change credentials mode state
  const [isChangingCredentials, setIsChangingCredentials] = useState(false);
  const [pin, setPin] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeSuccess, setChangeSuccess] = useState("");

  useEffect(() => {
    // Load credentials from localStorage on mount
    const savedUser = localStorage.getItem("iit_username");
    const savedPass = localStorage.getItem("iit_password");
    if (savedUser) setStoredUsername(savedUser);
    if (savedPass) setStoredPassword(savedPass);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === storedUsername && password === storedPassword) {
      navigate({ to: "/form" });
    } else {
      setError("Incorrect username or password.");
    }
  };

  const handleChangeCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");
    setChangeSuccess("");

    if (pin !== ADMIN_PIN) {
      setChangeError("Incorrect 6-digit PIN.");
      return;
    }

    if (!newUsername || !newPassword) {
      setChangeError("New username and password cannot be empty.");
      return;
    }

    localStorage.setItem("iit_username", newUsername);
    localStorage.setItem("iit_password", newPassword);
    setStoredUsername(newUsername);
    setStoredPassword(newPassword);

    setChangeSuccess("Credentials changed successfully.");
    setTimeout(() => {
      setIsChangingCredentials(false);
      setPin("");
      setNewUsername("");
      setNewPassword("");
      setChangeSuccess("");
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-desk font-sans text-ink p-4">
      <div className="w-full max-w-md bg-paper p-8 rounded-[10px] shadow-[0_1px_0_rgba(0,0,0,0.04),0_28px_50px_-24px_rgba(24,34,54,0.45)] ring-1 ring-black/5">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/logo-bg-removed.png"
              alt="Indian Info Tech Logo"
              className="h-24 object-contain"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">IIT GST Invoice Generator</h1>
          <p className="text-sm text-inksoft mt-1">
            {isChangingCredentials ? "Change your credentials" : "Sign in to generate invoices"}
          </p>
        </div>

        {isChangingCredentials ? (
          <>
            {changeError && (
              <div className="mb-4 rounded-[6px] border border-destructive/30 bg-destructive/8 px-4 py-2 text-sm text-destructive">
                {changeError}
              </div>
            )}
            {changeSuccess && (
              <div className="mb-4 rounded-[6px] border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-600">
                {changeSuccess}
              </div>
            )}
            <form onSubmit={handleChangeCredentials} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-inksoft mb-1.5">
                  6-Digit Admin PIN
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="6-Digit PIN"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-inksoft mb-1.5">
                  New Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="New Username"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-inksoft mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="New Password"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsChangingCredentials(false)}
                  className="w-full rounded-[8px] border border-rule bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-desk transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full rounded-[8px] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground ring-1 ring-accent/60 transition-opacity hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-[6px] border border-destructive/30 bg-destructive/8 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-inksoft mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-inksoft mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Password"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2 rounded-[8px] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground ring-1 ring-accent/60 transition-opacity hover:opacity-90"
              >
                Sign In
              </button>
            </form>
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsChangingCredentials(true)}
                className="text-xs text-inksoft hover:text-accent transition-colors hover:underline"
              >
                Change Username & Password
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
