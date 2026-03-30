/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  render?: (item: any) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  keyField: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (item: any) => void;
  emptyMessage?: string;
}

export function DataTable({
  columns,
  data,
  keyField,
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  onRowClick,
  emptyMessage = 'No records found',
}: DataTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Filter
  const filtered = data.filter(item =>
    search === '' ||
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  // Sort
  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const aVal = String(a[sortKey] || '');
        const bVal = String(b[sortKey] || '');
        const result = aVal.localeCompare(bVal);
        return sortDir === 'asc' ? result : -result;
      })
    : filtered;

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize);
  const startIdx = (page - 1) * pageSize;
  const paged = sorted.slice(startIdx, startIdx + pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="data-table-wrapper">
      {searchable && (
        <div className="data-table__search">
          <Search size={16} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      )}

      <div className="data-table__scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={col.sortable !== false ? 'data-table__sortable' : ''}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="data-table__sort-icon">
                      {sortDir === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-table__empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map(item => (
                <tr
                  key={String(item[keyField])}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'data-table__clickable' : ''}
                >
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(item) : String(item[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="data-table__pagination">
          <span className="data-table__page-info">
            Showing {startIdx + 1}–{Math.min(startIdx + pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="data-table__page-controls">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="data-table__page-btn"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`data-table__page-btn ${page === i + 1 ? 'data-table__page-btn--active' : ''}`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="data-table__page-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
