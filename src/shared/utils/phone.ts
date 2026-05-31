export function formatPhone(value: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 10) return value
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}
