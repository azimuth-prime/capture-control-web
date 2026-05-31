import { useEffect } from 'react'

const MIN_LENGTH = 3
const DELAY_MS = 300

export function useBarcodeScanner(onScan: (barcode: string) => void): void {
  useEffect(() => {
    let chars: string[] = []
    let pressed = false
    let enterPressedLast = false

    const handler = (e: KeyboardEvent) => {
      const ENTER = 13
      if (e.which !== ENTER) {
        chars.push(String.fromCharCode(e.which))
      }
      enterPressedLast = e.which === ENTER

      if (!pressed) {
        setTimeout(() => {
          if (chars.length >= MIN_LENGTH && enterPressedLast) {
            onScan(chars.join(''))
          }
          chars = []
          pressed = false
        }, DELAY_MS)
      }
      pressed = true
    }

    document.addEventListener('keypress', handler)
    return () => document.removeEventListener('keypress', handler)
  }, [onScan])
}
