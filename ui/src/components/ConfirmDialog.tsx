import React from "react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  } as React.CSSProperties,
  dialog: {
    background: "#fff",
    borderRadius: 8,
    padding: 24,
    minWidth: 340,
    maxWidth: 480,
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
  } as React.CSSProperties,
  title: { fontSize: 18, fontWeight: 600, marginBottom: 12 } as React.CSSProperties,
  message: { fontSize: 14, color: "#555", marginBottom: 20, lineHeight: 1.5 } as React.CSSProperties,
  actions: { display: "flex", gap: 8, justifyContent: "flex-end" } as React.CSSProperties,
  cancelBtn: {
    padding: "8px 16px",
    border: "1px solid #ccc",
    borderRadius: 4,
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
  } as React.CSSProperties,
  confirmBtn: {
    padding: "8px 16px",
    border: "none",
    borderRadius: 4,
    background: "#dc3545",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  } as React.CSSProperties,
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div style={styles.title}>{title}</div>
        <div style={styles.message}>{message}</div>
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button style={styles.confirmBtn} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
