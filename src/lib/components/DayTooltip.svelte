<script lang="ts">
  import { formatHistoryDate, formatUptime } from '$lib/format';
  import { serviceStatus } from '$lib/status';
  import type { HistoryDay } from '$lib/types';
  let { day }: { day: HistoryDay } = $props();
</script>

<div class="day-detail" role="status">
  <strong>{formatHistoryDate(day.date)}</strong>
  <span style={`color: ${serviceStatus[day.status].color}`}>{serviceStatus[day.status].label}</span>
  <span>{formatUptime(day.uptime)}</span>
  {#if day.averageLatency !== null}<span>平均响应 {day.averageLatency} ms</span>{/if}
</div>

<style>
  .day-detail { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 16px; min-height: 40px; margin-top: 12px; padding: 8px 12px; border: 1px solid #313131; border-radius: 8px; background: #1F1F1F; color: #A3A3A3; font-size: 12px; line-height: 16px; animation: enter 300ms cubic-bezier(.22,1,.36,1); }
  strong { color: #FFF; font-weight: 500; }
  @keyframes enter { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  @media (prefers-reduced-motion: reduce) { .day-detail { animation: none; } }
</style>
