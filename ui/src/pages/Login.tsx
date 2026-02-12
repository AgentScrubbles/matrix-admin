import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1a1a2e",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  card: {
    background: "#fff",
    borderRadius: 8,
    padding: 32,
    width: 360,
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  } as React.CSSProperties,
  title: { fontSize: 22, fontWeight: 700, marginBottom: 4 } as React.CSSProperties,
  subtitle: { fontSize: 14, color: "#888", marginBottom: 24 } as React.CSSProperties,
  field: { marginBottom: 16 } as React.CSSProperties,
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: 14,
    boxSizing: "border-box",
  } as React.CSSProperties,
  btn: {
    width: "100%",
    padding: "10px 0",
    background: "#16213e",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  } as React.CSSProperties,
  error: {
    background: "#fef2f2",
    color: "#dc3545",
    padding: "8px 12px",
    borderRadius: 4,
    fontSize: 13,
    marginBottom: 16,
  } as React.CSSProperties,
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.title}>Matrix Admin</div>
        <div style={styles.subtitle}>halflings.chat</div>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.field}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            autoFocus
            required
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button style={styles.btn} type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
