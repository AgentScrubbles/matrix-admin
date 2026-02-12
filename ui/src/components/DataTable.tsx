import React from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  onRowClick?: (row: T) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: 6,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  } as React.CSSProperties,
  th: {
    textAlign: "left",
    padding: "10px 14px",
    borderBottom: "2px solid #eee",
    fontSize: 13,
    fontWeight: 600,
    color: "#666",
    background: "#fafafa",
  } as React.CSSProperties,
  td: {
    padding: "10px 14px",
    borderBottom: "1px solid #f0f0f0",
    fontSize: 14,
  } as React.CSSProperties,
  row: { cursor: "pointer", transition: "background 0.1s" } as React.CSSProperties,
  pager: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    padding: "12px 0",
  } as React.CSSProperties,
  pageBtn: {
    padding: "4px 12px",
    border: "1px solid #ccc",
    borderRadius: 4,
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
  } as React.CSSProperties,
};

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  page,
  totalPages,
  onPageChange,
}: Props<T>) {
  return (
    <>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={styles.th}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={String(row[keyField])}
              style={onRowClick ? styles.row : undefined}
              onClick={() => onRowClick?.(row)}
              onMouseEnter={(e) => {
                if (onRowClick) e.currentTarget.style.background = "#f8f8ff";
              }}
              onMouseLeave={(e) => {
                if (onRowClick) e.currentTarget.style.background = "";
              }}
            >
              {columns.map((col) => (
                <td key={col.key} style={styles.td}>
                  {col.render
                    ? col.render(row)
                    : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{ ...styles.td, textAlign: "center", color: "#999" }}
              >
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPages !== undefined && totalPages > 1 && onPageChange && (
        <div style={styles.pager}>
          <button
            style={styles.pageBtn}
            disabled={page === 0}
            onClick={() => onPageChange(Math.max(0, (page ?? 0) - 1))}
          >
            Previous
          </button>
          <span style={{ padding: "4px 8px", fontSize: 13 }}>
            Page {(page ?? 0) + 1} of {totalPages}
          </span>
          <button
            style={styles.pageBtn}
            disabled={(page ?? 0) >= totalPages - 1}
            onClick={() => onPageChange((page ?? 0) + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
