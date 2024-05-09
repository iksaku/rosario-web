import { DateTime } from 'luxon'

export function now() {
  return DateTime.local({ zone: 'America/Monterrey' })
}