import React, { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";

interface Room {
  room_id: string;
  name: string;
  canonical_alias: string;
  joined_members: number;
  topic: string;
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

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Record<string, unknown> | null>(null);

  const loadRooms = useCallback(() => {
    const params = new URLSearchParams({ from: String(page * PAGE_SIZE), limit: String(PAGE_SIZE) });
    if (search) params.set("search_term", search);
    api.get<{ rooms: Room[]; total_rooms: number }>(`/rooms?${params}`).then((d) => {
      setRooms(d.rooms || []);
      setTotal(d.total_rooms || 0);
    });
  }, [page, search]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const handleViewDetails = async (roomId: string) => {
    const details = await api.get<Record<string, unknown>>(`/rooms/${encodeURIComponent(roomId)}/details`);
    setSelectedRoom(details);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.del(`/rooms/${encodeURIComponent(deleteTarget)}`);
    setDeleteTarget(null);
    loadRooms();
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Rooms</h2>

      <input
        placeholder="Search rooms..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        style={{ marginBottom: 12, padding: "8px 12px", border: "1px solid #ccc", borderRadius: 4, width: 300, fontSize: 14 }}
      />

      <DataTable
        columns={[
          { key: "name", header: "Name", render: (r) => String(r.name || r.canonical_alias || r.room_id) },
          { key: "canonical_alias", header: "Alias" },
          { key: "joined_members", header: "Members" },
          { key: "topic", header: "Topic", render: (r) => { const t = String(r.topic || ""); return t.length > 60 ? t.slice(0, 60) + "..." : t; } },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <div style={{ display: "flex", gap: 4 }}>
                <button style={btnStyle} onClick={(e) => { e.stopPropagation(); handleViewDetails(String(r.room_id)); }}>Details</button>
                <button style={{ ...btnStyle, color: "#dc3545" }} onClick={(e) => { e.stopPropagation(); setDeleteTarget(String(r.room_id)); }}>Delete</button>
              </div>
            ),
          },
        ]}
        data={rooms as unknown as Record<string, unknown>[]}
        keyField="room_id"
        page={page}
        totalPages={Math.ceil(total / PAGE_SIZE)}
        onPageChange={setPage}
      />

      {selectedRoom && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setSelectedRoom(null)}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, width: 560, maxHeight: "80vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Room Details</h3>
              <button style={btnStyle} onClick={() => setSelectedRoom(null)}>Close</button>
            </div>
            <pre style={{ fontSize: 13, background: "#f5f5f5", padding: 16, borderRadius: 4, overflow: "auto", maxHeight: 400 }}>
              {JSON.stringify(selectedRoom, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Room"
        message={`Are you sure you want to delete room ${deleteTarget}? All messages will be purged. This cannot be undone.`}
        confirmLabel="Delete Room"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
