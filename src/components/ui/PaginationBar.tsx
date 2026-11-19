import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function PaginationBar({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
  itemLabel = 'records',
}: PaginationBarProps) {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return (
    <div
      className="no-print"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 0.5rem 0.25rem 0.5rem',
        marginTop: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        flexWrap: 'wrap',
        gap: '0.85rem',
      }}
    >
      <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
        Showing <strong style={{ color: '#ffffff' }}>{startIndex + 1}</strong> to{' '}
        <strong style={{ color: '#ffffff' }}>{endIndex}</strong> of{' '}
        <strong style={{ color: '#ffffff' }}>{totalItems}</strong> {itemLabel} (10 per page)
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          className="btn-glass"
          style={{
            padding: '0.38rem 0.75rem',
            fontSize: '0.8rem',
            opacity: safePage === 1 ? 0.4 : 1,
            cursor: safePage === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={15} /> Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
          if (totalPages > 7 && Math.abs(page - safePage) > 2 && page !== 1 && page !== totalPages) {
            if (page === 2 || page === totalPages - 1) {
              return (
                <span key={page} style={{ color: '#64748b', padding: '0 0.25rem' }}>
                  …
                </span>
              );
            }
            return null;
          }
          const isActive = safePage === page;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className="btn-glass"
              style={{
                padding: '0.38rem 0.7rem',
                fontSize: '0.8rem',
                minWidth: '32px',
                background: isActive ? 'rgba(34, 197, 94, 0.3)' : 'transparent',
                borderColor: isActive ? '#22c55e' : 'rgba(255, 255, 255, 0.12)',
                color: isActive ? '#4ade80' : '#cbd5e1',
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          className="btn-glass"
          style={{
            padding: '0.38rem 0.75rem',
            fontSize: '0.8rem',
            opacity: safePage === totalPages ? 0.4 : 1,
            cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
