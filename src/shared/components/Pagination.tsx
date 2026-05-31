interface PaginationProps {
  page: number
  pages: number
  hasNext: boolean
  hasPrevious: boolean
  onPageChange: (page: number) => void
}

export function Pagination({ page, pages, hasNext, hasPrevious, onPageChange }: PaginationProps) {
  if (pages <= 1) return null

  return (
    <nav className="flex flex-wrap items-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevious}
        className="rounded border px-3 py-1 text-sm hover:bg-muted disabled:opacity-40"
      >
        Previous
      </button>
      {Array.from({ length: pages }, (_, i) => (
        <button
          key={i}
          onClick={() => onPageChange(i)}
          disabled={i === page}
          className={`rounded border px-3 py-1 text-sm ${
            i === page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        className="rounded border px-3 py-1 text-sm hover:bg-muted disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  )
}
