import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";

interface User {
  name: string;
  displayname: string;
  admin: number;
  deactivated: number;
  creation_ts: number;
}

const PAGE_SIZE = 50;

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
};

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", displayname: "" });
  const [createResult, setCreateResult] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<string | null>(null);

  const loadUsers = useCallback(() => {
    const params = new URLSearchParams({ from: String(page * PAGE_SIZE), limit: String(PAGE_SIZE) });
    if (search) params.set("name", search);
    api.get<{ users: User[]; total: number }>(`/users?${params}`).then((d) => {
      setUsers(d.users || []);
      setTotal(d.total || 0);
    });
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleCreate = async () => {
    try {
      const result = await api.post<{ generated_password?: string }>("/users", {
        username: newUser.username,
        password: newUser.password || undefined,
        displayname: newUser.displayname || undefined,
      });
      setCreateResult(
        result.generated_password
          ? `User created. Generated password: ${result.generated_password}`
          : "User created successfully."
      );
      setShowCreate(false);
      setNewUser({ username: "", password: "", displayname: "" });
      loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      const result = await api.post<{ new_password: string }>(
        `/users/${encodeURIComponent(resetTarget)}/reset-password`,
        {}
      );
      setResetResult(`New password for ${resetTarget}: ${result.new_password}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reset password");
    }
    setResetTarget(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Users</h2>
        <button style={{ ...btnStyle, background: "#16213e", color: "#fff" }} onClick={() => setShowCreate(true)}>
          Create User
        </button>
      </div>

      <input
        placeholder="Search users..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        style={{ marginBottom: 12, padding: "8px 12px", border: "1px solid #ccc", borderRadius: 4, width: 300, fontSize: 14 }}
      />

      {createResult && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", padding: "10px 14px", borderRadius: 4, marginBottom: 12, fontSize: 13, fontFamily: "monospace" }}>
          {createResult}
          <button onClick={() => setCreateResult(null)} style={{ ...btnStyle, marginLeft: 12, padding: "2px 8px" }}>Dismiss</button>
        </div>
      )}
      {resetResult && (
        <div style={{ background: "#fefce8", border: "1px solid #fde047", padding: "10px 14px", borderRadius: 4, marginBottom: 12, fontSize: 13, fontFamily: "monospace" }}>
          {resetResult}
          <button onClick={() => setResetResult(null)} style={{ ...btnStyle, marginLeft: 12, padding: "2px 8px" }}>Dismiss</button>
        </div>
      )}

      <DataTable
        columns={[
          { key: "name", header: "User ID" },
          { key: "displayname", header: "Display Name" },
          { key: "admin", header: "Admin", render: (u) => (u.admin ? "Yes" : "No") },
          { key: "deactivated", header: "Active", render: (u) => (u.deactivated ? "No" : "Yes") },
          {
            key: "actions",
            header: "Actions",
            render: (u) => (
              <button
                style={btnStyle}
                onClick={(e) => { e.stopPropagation(); setResetTarget(u.name); }}
              >
                Reset Password
              </button>
            ),
          },
        ]}
        data={users as unknown as Record<string, unknown>[]}
        keyField="name"
        onRowClick={(u) => navigate(`/users/${encodeURIComponent(String(u.name))}`)}
        page={page}
        totalPages={Math.ceil(total / PAGE_SIZE)}
        onPageChange={setPage}
      />

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, width: 380 }}>
            <h3 style={{ margin: "0 0 16px" }}>Create User</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Username</label>
              <input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 4, boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Password (blank to auto-generate)</label>
              <input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 4, boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Display Name</label>
              <input value={newUser.displayname} onChange={(e) => setNewUser({ ...newUser, displayname: e.target.value })} style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 4, boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btnStyle} onClick={() => setShowCreate(false)}>Cancel</button>
              <button style={{ ...btnStyle, background: "#16213e", color: "#fff" }} onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!resetTarget}
        title="Reset Password"
        message={`Generate a new random password for ${resetTarget}? This will log out all their devices.`}
        confirmLabel="Reset"
        onConfirm={handleResetPassword}
        onCancel={() => setResetTarget(null)}
      />
    </div>
  );
}
