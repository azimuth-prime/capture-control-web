interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ title = 'Something went wrong', message, onRetry }: ErrorMessageProps) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-destructive">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-sm underline hover:no-underline">
          Try again
        </button>
      )}
    </div>
  )
}
