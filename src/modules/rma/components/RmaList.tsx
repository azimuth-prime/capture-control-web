import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { rmaService } from '../services/rmaService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { RMAState } from '../types'

const STATE_CLASSES: Record<RMAState, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-blue-100 text-blue-800',
  COMPLETE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export function RmaList() {
  const navigate = useNavigate()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['rmas'],
    queryFn: () => rmaService.findAll().then((r) => r.data),
  })

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">RMAs</li>
        </ol>
      </nav>

      {isLoading && <LoadingSpinner message="Loading RMAs..." />}
      {isError && <ErrorMessage message={(error as Error).message} onRetry={refetch} />}

      {data && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-2">RMA #</th>
                <th className="px-4 py-2">Order #</th>
                <th className="px-4 py-2">State</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Issue Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((rma) => (
                <tr
                  key={rma.id}
                  onClick={() => navigate(`/rma/${rma.id}`)}
                  className="cursor-pointer border-b hover:bg-muted/40"
                >
                  <td className="px-4 py-2 font-mono text-xs">
                    {rma.id.length > 16 ? `...${rma.id.slice(-12)}` : rma.id}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {rma.order?.id
                      ? rma.order.id.length > 16
                        ? `...${rma.order.id.slice(-12)}`
                        : rma.order.id
                      : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATE_CLASSES[rma.state] ?? 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {rma.state}
                    </span>
                  </td>
                  <td className="px-4 py-2">{rma.creationDate?.substring(0, 10) ?? '—'}</td>
                  <td className="px-4 py-2">{rma.issueDate?.substring(0, 10) ?? '—'}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No RMAs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <p className="mt-4 text-sm text-muted-foreground">
          {data.length} RMA{data.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
