export function formatTime(timestamp: number, timezone: string) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(timestamp * 1000);
}

export function formatDate(timestamp: number, timezone: string) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: timezone, year: 'numeric', month: 'long', day: 'numeric' }).format(timestamp * 1000);
}

export function formatDateTime(timestamp: number, timezone: string) {
  return `${formatDate(timestamp, timezone)} ${formatTime(timestamp, timezone)}`;
}

export function formatHistoryDate(date: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

export function formatDuration(startedAt: number, endedAt: number | null, now = Date.now() / 1000) {
  const seconds = Math.max(0, Math.floor((endedAt || now) - startedAt));
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))} 分钟`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时 ${Math.floor((seconds % 3600) / 60)} 分钟`;
  return `${Math.floor(seconds / 86400)} 天 ${Math.floor((seconds % 86400) / 3600)} 小时`;
}

export function formatUptime(value: number | null) {
  return value === null ? '暂无可用率' : `${value.toFixed(2)}% 可用率`;
}
