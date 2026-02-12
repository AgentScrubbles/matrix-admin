import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const styles = {
  heading: { fontSize: 22, fontWeight: 700, marginBottom: 20 } as React.CSSProperties,
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220, 1fr))", gap: 16, marginBottom: 24 } as React.CSSProperties,
  card: {
    background: "#fff",
    borderRadius: 6,
    padding: "20px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  } as React.CSSProperties,
  cardLabel: { fontSize: 13, color: "#888", marginBottom: 4 } as React.CSSProperties,
  cardValue: { fontSize: 24, fontWeight: 700 } as React.CSSProperties,
  actions: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 } as React.CSSProperties,
  actionBtn: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 6,
    padding: "16px 20px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 500,
    transition: "box-shadow 0.15s",
  } as React.CSSProperties,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [version, setVersion] = useState<string>("");
  const [userCount, setUserCount] = useState<number | null>(null);
  const [roomCount, setRoomCount] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ server_version: string }>("/server/version").then((d) =>
      setVersion(d.server_version || JSON.stringify(d))
    ).catch(() => {});
    api.get<{ total: number }>("/users?limit=1").then((d) => setUserCount(d.total)).catch(() => {});
    api.get<{ total_rooms: number }>("/rooms?limit=1").then((d) => setRoomCount(d.total_rooms)).catch(() => {});
  }, []);

  return (
    <div>
      <div style={styles.heading}>Dashboard</div>
      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Server Version</div>
          <div style={{ ...styles.cardValue, fontSize: 16 }}>{version || "..."}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Users</div>
          <div style={styles.cardValue}>{userCount ?? "..."}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Rooms</div>
          <div style={styles.cardValue}>{roomCount ?? "..."}</div>
        </div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Quick Actions</div>
      <div style={styles.actions}>
        <button style={styles.actionBtn} onClick={() => navigate("/users")}>
          Manage Users
        </button>
        <button style={styles.actionBtn} onClick={() => navigate("/tokens")}>
          Registration Tokens
        </button>
        <button style={styles.actionBtn} onClick={() => navigate("/media")}>
          Media Cleanup
        </button>
        <button style={styles.actionBtn} onClick={() => navigate("/rooms")}>
          Browse Rooms
        </button>
      </div>
    </div>
  );
}
