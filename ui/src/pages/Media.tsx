import React, { useState } from "react";
import { api } from "../api/client";
import ConfirmDialog from "../components/ConfirmDialog";

const btnStyle: React.CSSProperties = {
  padding: "8px 16px",
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 6,
  padding: 24,
  marginBottom: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

export default function Media() {
  const [beforeDate, setBeforeDate] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"local" | "remote" | null>(null);

  const getTimestamp = () => {
    if (!beforeDate) return null;
    return new Date(beforeDate).getTime();
  };

  const handleDeleteOld = async () => {
    const ts = getTimestamp();
    if (!ts) return;
    const res = await api.post<{ total: number }>("/media/delete-old", { before_ts: ts });
    setResult(`Deleted ${res.total ?? 0} local media items older than ${beforeDate}.`);
    setConfirmAction(null);
  };

  const handlePurgeRemote = async () => {
    const ts = getTimestamp();
    if (!ts) return;
    const res = await api.post<{ deleted: number }>("/media/purge-remote", { before_ts: ts });
    setResult(`Purged ${res.deleted ?? 0} remote media items from cache.`);
    setConfirmAction(null);
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Media Management</h2>

      {result && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", padding: "10px 14px", borderRadius: 4, marginBottom: 16, fontSize: 14 }}>
          {result}
          <button onClick={() => setResult(null)} style={{ ...btnStyle, marginLeft: 12, padding: "2px 8px", fontSize: 13 }}>Dismiss</button>
        </div>
      )}

      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 12px" }}>Clean Up Media</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Delete media created before:
          </label>
          <input
            type="date"
            value={beforeDate}
            onChange={(e) => setBeforeDate(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 4, fontSize: 14 }}
          />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            style={{ ...btnStyle, background: "#dc3545", color: "#fff", border: "none" }}
            onClick={() => setConfirmAction("local")}
            disabled={!beforeDate}
          >
            Delete Local Media
          </button>
          <button
            style={{ ...btnStyle, background: "#e67e22", color: "#fff", border: "none" }}
            onClick={() => setConfirmAction("remote")}
            disabled={!beforeDate}
          >
            Purge Remote Media Cache
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === "local"}
        title="Delete Old Local Media"
        message={`Delete all local media created before ${beforeDate}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteOld}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === "remote"}
        title="Purge Remote Media Cache"
        message={`Purge all cached remote media from before ${beforeDate}?`}
        confirmLabel="Purge"
        onConfirm={handlePurgeRemote}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
