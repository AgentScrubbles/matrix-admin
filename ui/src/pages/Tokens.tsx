import React, { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";

interface Token {
  token: string;
  uses_allowed: number | null;
  pending: number;
  completed: number;
  expiry_time: number | null;
}

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
};

export default function Tokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [usesAllowed, setUsesAllowed] = useState("");
  const [invalidateOpen, setInvalidateOpen] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const loadTokens = useCallback(() => {
    api.get<{ registration_tokens: Token[] }>("/registration-tokens").then((d) =>
      setTokens(d.registration_tokens || [])
    );
  }, []);

  useEffect(() => { loadTokens(); }, [loadTokens]);

  const handleCreate = async () => {
    const data: Record<string, unknown> = {};
    if (usesAllowed) data.uses_allowed = parseInt(usesAllowed, 10);
    const result = await api.post<{ token: string }>("/registration-tokens", data);
    setCreatedToken(result.token);
    setShowCreate(false);
    setUsesAllowed("");
    loadTokens();
  };

  const handleInvalidateAll = async () => {
    await api.post<{ deleted: number }>("/registration-tokens/invalidate-all");
    setInvalidateOpen(false);
    loadTokens();
  };

  const handleDelete = async (token: string) => {
    await api.del(`/registration-tokens/${token}`);
    loadTokens();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Registration Tokens</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...btnStyle, background: "#dc3545", color: "#fff", border: "none" }} onClick={() => setInvalidateOpen(true)}>
            Invalidate All
          </button>
          <button style={{ ...btnStyle, background: "#16213e", color: "#fff" }} onClick={() => setShowCreate(true)}>
            Create Token
          </button>
        </div>
      </div>

      {createdToken && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", padding: "10px 14px", borderRadius: 4, marginBottom: 12, fontSize: 14, fontFamily: "monospace" }}>
          New token: <strong>{createdToken}</strong>
          <button onClick={() => setCreatedToken(null)} style={{ ...btnStyle, marginLeft: 12, padding: "2px 8px" }}>Dismiss</button>
        </div>
      )}

      <DataTable
        columns={[
          { key: "token", header: "Token" },
          { key: "uses_allowed", header: "Uses Allowed", render: (t) => (t.uses_allowed === null ? "Unlimited" : String(t.uses_allowed)) },
          { key: "pending", header: "Pending" },
          { key: "completed", header: "Used" },
          {
            key: "expiry_time",
            header: "Expires",
            render: (t) => (t.expiry_time ? new Date(Number(t.expiry_time)).toLocaleString() : "Never"),
          },
          {
            key: "actions",
            header: "",
            render: (t) => (
              <button style={{ ...btnStyle, color: "#dc3545" }} onClick={() => handleDelete(String(t.token))}>
                Delete
              </button>
            ),
          },
        ]}
        data={tokens as unknown as Record<string, unknown>[]}
        keyField="token"
      />

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, width: 340 }}>
            <h3 style={{ margin: "0 0 16px" }}>Create Registration Token</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Uses Allowed (blank for unlimited)</label>
              <input value={usesAllowed} onChange={(e) => setUsesAllowed(e.target.value)} type="number" min="1"
                style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 4, boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btnStyle} onClick={() => setShowCreate(false)}>Cancel</button>
              <button style={{ ...btnStyle, background: "#16213e", color: "#fff" }} onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={invalidateOpen}
        title="Invalidate All Tokens"
        message="Are you sure you want to delete ALL valid registration tokens? This cannot be undone."
        confirmLabel="Invalidate All"
        onConfirm={handleInvalidateAll}
        onCancel={() => setInvalidateOpen(false)}
      />
    </div>
  );
}
