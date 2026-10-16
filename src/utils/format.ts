export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, index)
  const decimals = index === 0 || value >= 10 ? 0 : 1
  return `${value.toFixed(decimals)} ${units[index]}`
}

export function formatDuration(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '--:--'
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const ss = String(secs).padStart(2, '0')
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`
  }
  return `${minutes}:${ss}`
}

export function gainToDb(percent: number): string {
  const db = 20 * Math.log10(percent / 100)
  const sign = db > 0 ? '+' : ''
  return `${sign}${db.toFixed(1)} dB`
}
