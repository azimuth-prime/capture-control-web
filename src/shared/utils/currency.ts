export function formatCurrency(value: number): string {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function splitCurrency(value: number): { dollars: string; cents: string } {
  const fixed = (value ?? 0).toFixed(2)
  const [whole, cents] = fixed.split('.')
  return {
    dollars: `$${Number(whole).toLocaleString('en-US')}.`,
    cents,
  }
}
