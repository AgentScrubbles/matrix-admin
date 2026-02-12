import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../App";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/users", label: "Users" },
  { to: "/tokens", label: "Tokens" },
  { to: "/media", label: "Media" },
  { to: "/rooms", label: "Rooms" },
];

const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
  } as React.CSSProperties,
  sidebar: {
    width: 220,
    background: "#1a1a2e",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
    flexShrink: 0,
  } as React.CSSProperties,
  logo: {
    fontSize: 18,
    fontWeight: 700,
    padding: "0 20px 20px",
    borderBottom: "1px solid #333",
    marginBottom: 10,
  } as React.CSSProperties,
  nav: { display: "flex", flexDirection: "column", gap: 2, padding: "10px 0" } as React.CSSProperties,
  navLink: {
    color: "#aaa",
    textDecoration: "none",
    padding: "10px 20px",
    fontSize: 14,
    transition: "background 0.15s, color 0.15s",
  } as React.CSSProperties,
  navLinkActive: {
    color: "#fff",
    background: "#16213e",
  } as React.CSSProperties,
  main: { flex: 1, background: "#f5f5f5" } as React.CSSProperties,
  header: {
    background: "#fff",
    padding: "12px 24px",
    borderBottom: "1px solid #ddd",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    fontSize: 14,
  } as React.CSSProperties,
  content: { padding: 24 } as React.CSSProperties,
  logoutBtn: {
    background: "none",
    border: "1px solid #ccc",
    borderRadius: 4,
    padding: "4px 12px",
    cursor: "pointer",
    fontSize: 13,
  } as React.CSSProperties,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user_id, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.sidebar}>
        <div style={styles.logo}>Matrix Admin</div>
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div style={styles.main}>
        <div style={styles.header}>
          <span>{user_id}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
}
