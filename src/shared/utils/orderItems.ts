export function calculateTotalOrderItems(items: Array<{ quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}
