import type { SaveStorage } from '../src/store/storage'

export function memoryStorage(initial: string | null = null): SaveStorage & { value: string | null } {
  const box = {
    value: initial,
    read: () => box.value,
    write: (json: string) => {
      box.value = json
    },
    clear: () => {
      box.value = null
    },
  }
  return box
}
