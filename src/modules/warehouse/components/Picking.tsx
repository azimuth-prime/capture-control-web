import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { warehouseService } from '../services/warehouseService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'

export function Picking() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)

  const debouncedKeyword = useDebounce(keyword, 300)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['pickable-orders', debouncedKeyword, page],
    queryFn: () =>
      warehouseService
        .findPickableOrderBykeyword({
          keyword: debouncedKeyword.length > 0 ? debouncedKeyword : '*',
          page,
          resultsPerPage: 30,
        })
        .then((r) => r.data),
  })

  function handleKeywordChange(value: string) {
    setKeyword(value)
    setPage(0)
  }

  return (
    <div className='container-fluid px-4 py-2'>
      <nav className='mb-4 text-sm text-muted-foreground'>
        <ol className='flex gap-2'>
          <li><Link to='/' className='hover:underline'>Dashboard</Link></li>
          <li>/</li>
          <li className='font-medium text-foreground'>Picking</li>
        </ol>
      </nav>

      <div className='mb-4'>
        <input
          type='text'
          placeholder='Search orders to pick...'
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className='w-full max-w-sm rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
        />
      </div>

      {isLoading && <LoadingSpinner message='Loading orders...' />}
      {isError && <ErrorMessage message={(error as Error).message} onRetry={refetch} />}

      {data && (
        <>
          <div className='overflow-x-auto rounded-lg border bg-card'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b bg-muted/40 text-left text-muted-foreground'>
                  <th className='px-4 py-2'>Order #</th>
                  <th className='px-4 py-2'>Customer</th>
                  <th className='px-4 py-2'>State</th>
                  <th className='px-4 py-2'>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/pick-details/${order.id}`)}
                    className='cursor-pointer border-b hover:bg-muted/40'
                  >
                    <td className='px-4 py-2 font-mono text-xs'>{order.id}</td>
                    <td className='px-4 py-2'>{order.customerName}</td>
                    <td className='px-4 py-2'>
                      <span className='rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800'>
                        {order.state}
                      </span>
                    </td>
                    <td className='px-4 py-2'>{order.creationDate?.substring(0, 10)}</td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={4} className='px-4 py-8 text-center text-muted-foreground'>
                      No orders ready to pick.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className='mt-4 flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              {data.totalResults} order{data.totalResults !== 1 ? 's' : ''}
            </p>
            <Pagination
              page={data.page}
              pages={Math.min(data.pages, 20)}
              hasNext={data.hasNext}
              hasPrevious={data.hasPrevious}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  )
}
