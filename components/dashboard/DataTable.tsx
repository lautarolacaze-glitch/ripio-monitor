"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  exportFilename?: string;
}

type SortDir = "asc" | "desc" | null;

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Buscar...",
  pageSize = 10,
  exportFilename = "export",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search || !searchKey) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      String(row[searchKey] ?? "")
        .toLowerCase()
        .includes(q)
    );
  }, [data, search, searchKey]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null || bVal == null) return 0;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((prev) =>
          prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
        );
        if (sortDir === "desc") setSortKey(null);
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      setPage(0);
    },
    [sortKey, sortDir]
  );

  function exportCSV() {
    const headers = columns.map((c) => c.header);
    const rows = sorted.map((row) =>
      columns.map((c) => {
        const val = row[c.key];
        const str = String(val ?? "");
        return str.includes(",") || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
    );
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="max-w-xs border-white/10 bg-white/5 text-white placeholder:text-slate-500"
          />
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          className="w-fit border-white/10 text-slate-300"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Exportar CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-white/10 bg-[#0f1d32]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.key} className="text-slate-400">
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-white"
                    >
                      {col.header}
                      {sortKey === col.key && sortDir === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : sortKey === col.key && sortDir === "desc" ? (
                        <ArrowDown className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow className="border-white/10">
                <TableCell
                  colSpan={columns.length}
                  className="py-6 text-center text-slate-500"
                >
                  Sin resultados
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, i) => (
                <TableRow key={i} className="border-white/10 hover:bg-white/5">
                  {columns.map((col) => (
                    <TableCell key={col.key} className="text-slate-300">
                      {col.render
                        ? col.render(row)
                        : String(row[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          {sorted.length === 0
            ? "0 resultados"
            : `${page * pageSize + 1}-${Math.min(
                (page + 1) * pageSize,
                sorted.length
              )} de ${sorted.length}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-slate-400"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="text-slate-400"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
