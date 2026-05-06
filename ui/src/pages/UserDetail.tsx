import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import ConfirmDialog from "../components/ConfirmDialog";

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
};

const sectionStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 6,
  padding: 20,
  marginBottom: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

interface Device {
  device_id: string;
  display_name: string;
  last_seen_ts: number;
  last_seen_ip: string;
}

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [whois, setWhois] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<"profile" | "devices" | "sessions">("profile");
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteDeviceId, setDeleteDeviceId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);

  const uid = decodeURIComponent(userId || "");

  useEffect(() => {
    if (!uid) return;
    api.get<Record<string, unknown>>(`/users/${encodeURIComponent(uid)}`).then(setUser).catch(() => navigate("/users"));
  }, [uid, navigate]);

  useEffect(() => {
    if (!uid) return;
    if (tab === "devices") {
      api.get<{ devices: Device[] }>(`/users/${encodeURIComponent(uid)}/devices`).then((d) => setDevices(d.devices || []));
    } else if (tab === "sessions") {
      api.get<Record<string, unknown>>(`/users/${encodeURIComponent(uid)}/whois`).then(setWhois);
    }
  }, [uid, tab]);

  const handleDeactivate = async () => {
    await api.post(`/users/${encodeURIComponent(uid)}/deactivate`);
    setDeactivateOpen(false);
    api.get<Record<string, unknown>>(`/users/${encodeURIComponent(uid)}`).then(setUser);
  };

  const handleDeleteDevice = async () => {
    if (!deleteDeviceId) return;
    await api.del(`/users/${encodeURIComponent(uid)}/devices/${deleteDeviceId}`);
    setDeleteDeviceId(null);
    api.get<{ devices: Device[] }>(`/users/${encodeURIComponent(uid)}/devices`).then((d) => setDevices(d.devices || []));
  };

  const handleGenerateToken = async () => {
    setGeneratingToken(true);
    try {
      const result = await api.post<{ access_token: string }>(`/users/${encodeURIComponent(uid)}/login`);
      setAccessToken(result.access_token);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate token");
    } finally {
      setGeneratingToken(false);
    }
  };

  if (!user) return <div>Loading...</div>;
  const isBot = user.user_type === "bot";

  const tabs = ["profile", "devices", "sessions"] as const;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button style={btnStyle} onClick={() => navigate("/users")}>Back</button>
        <h2 style={{ margin: 0 }}>{uid}</h2>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...btnStyle,
              background: tab === t ? "#16213e" : "#fff",
              color: tab === t ? "#fff" : "#333",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div style={sectionStyle}>
          <table style={{ fontSize: 14 }}>
            <tbody>
              {[
                ["Display Name", user.displayname],
                ["Admin", user.admin ? "Yes" : "No"],
                ["User Type", user.user_type === "bot" ? "Bot" : "Regular"],
                ["Active", user.deactivated ? "No" : "Yes"],
                ["Created", user.creation_ts ? new Date(Number(user.creation_ts) * 1000).toLocaleString() : "—"],
                ["Avatar URL", user.avatar_url || "—"],
              ].map(([label, value]) => (
                <tr key={String(label)}>
                  <td style={{ fontWeight: 600, padding: "6px 16px 6px 0", whiteSpace: "nowrap" }}>{String(label)}</td>
                  <td style={{ padding: "6px 0" }}>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            {isBot && (
              <button
                style={{ ...btnStyle, background: "#16213e", color: "#fff", border: "none" }}
                onClick={handleGenerateToken}
                disabled={generatingToken}
              >
                {generatingToken ? "Generating..." : "Generate Access Token"}
              </button>
            )}
            <button
              style={{ ...btnStyle, background: "#dc3545", color: "#fff", border: "none" }}
              onClick={() => setDeactivateOpen(true)}
              disabled={!!user.deactivated}
            >
              Deactivate User
            </button>
          </div>
          {accessToken && (
            <div style={{ marginTop: 12, background: "#f0fdf4", border: "1px solid #86efac", padding: "10px 14px", borderRadius: 4, fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Access Token</div>
              <code style={{ wordBreak: "break-all", userSelect: "all" }}>{accessToken}</code>
              <button style={{ ...btnStyle, marginLeft: 12, padding: "2px 8px" }} onClick={() => setAccessToken(null)}>Dismiss</button>
            </div>
          )}
        </div>
      )}

      {tab === "devices" && (
        <div style={sectionStyle}>
          {devices.length === 0 ? (
            <div style={{ color: "#999" }}>No devices</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["Device ID", "Display Name", "Last Seen", "IP", ""].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #eee", fontSize: 13, color: "#666" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.device_id}>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0" }}>{d.device_id}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0" }}>{d.display_name || "—"}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0" }}>{d.last_seen_ts ? new Date(d.last_seen_ts).toLocaleString() : "—"}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0" }}>{d.last_seen_ip || "—"}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0" }}>
                      <button style={{ ...btnStyle, color: "#dc3545" }} onClick={() => setDeleteDeviceId(d.device_id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "sessions" && (
        <div style={sectionStyle}>
          <pre style={{ fontSize: 13, background: "#f5f5f5", padding: 16, borderRadius: 4, overflow: "auto", maxHeight: 500 }}>
            {whois ? JSON.stringify(whois, null, 2) : "Loading..."}
          </pre>
        </div>
      )}

      <ConfirmDialog
        open={deactivateOpen}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${uid}? This cannot be easily undone.`}
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateOpen(false)}
      />
      <ConfirmDialog
        open={!!deleteDeviceId}
        title="Delete Device"
        message={`Delete device ${deleteDeviceId}? The user will be signed out on that device.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteDevice}
        onCancel={() => setDeleteDeviceId(null)}
      />
    </div>
  );
}
