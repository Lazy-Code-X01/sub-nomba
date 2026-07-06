import React from "react";

type CellRenderer<T> = (row: T) => React.ReactNode;

interface Column<T> {
  header: string;
  accessor: keyof T | CellRenderer<T>;
  className?: string;
}

interface DataTableProps<T extends { id?: string }> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T extends { id?: string }>({
  columns,
  data,
  emptyMessage = "No records found.",
  onRowClick,
}: DataTableProps<T>) {
  function renderCell(row: T, col: Column<T>): React.ReactNode {
    if (typeof col.accessor === "function") {
      return col.accessor(row);
    }
    const value = row[col.accessor];
    return value !== undefined && value !== null ? String(value) : "—";
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface-2 border-b border-stroke">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-label-2 whitespace-nowrap ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center font-mono text-[11px] text-label-3"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id ?? rowIdx}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-stroke/50 transition-colors ${
                  onRowClick
                    ? "cursor-pointer hover:bg-surface-2"
                    : "hover:bg-surface/50"
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-5 py-[13px] font-sans text-[13px] text-label-2 whitespace-nowrap ${col.className ?? ""}`}
                  >
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
