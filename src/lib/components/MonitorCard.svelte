<script lang="ts">
  import { CaretDown } from 'phosphor-svelte';
  import StatusBadge from './StatusBadge.svelte';
  import HistoryBars from './HistoryBars.svelte';
  import { formatDateTime } from '$lib/format';
  import { incidentStates } from '$lib/status';
  import type { Incident, PublicMonitor } from '$lib/types';

  let { monitor, incidents, timezone }: { monitor: PublicMonitor; incidents: Incident[]; timezone: string } = $props();
  let expanded = $state(false);
  const related = $derived(incidents.filter((incident) => incident.monitors.some((item) => item.tag === monitor.tag)));
</script>

<article class="monitor-card">
  <div class="heading">
    <div><h3>{monitor.name}</h3>{#if monitor.description}<p>{monitor.description}</p>{/if}</div>
    <StatusBadge status={monitor.status} label={monitor.dataError ? '数据不可用' : undefined} />
  </div>
  {#if monitor.dataError}<p class="data-error">该服务的监控数据获取失败，不代表服务已经宕机。</p>{/if}
  <HistoryBars tag={monitor.tag} {timezone} />
  <div class="monitor-meta">
    {#if monitor.averageLatency !== null}<span>近 24 小时平均响应 <strong>{monitor.averageLatency} ms</strong></span>{/if}
    {#if monitor.updatedAt}<span>最近检查 {formatDateTime(monitor.updatedAt, timezone)}</span>{/if}
  </div>
  <button class="expand" aria-expanded={expanded} aria-controls={`monitor-${monitor.tag}`} onclick={() => expanded = !expanded}>
    {expanded ? '收起相关事故' : `相关事故 ${related.length} 条`}<CaretDown size={16} class={expanded ? 'rotated' : ''} />
  </button>
  {#if expanded}
    <div class="related" id={`monitor-${monitor.tag}`}>
      {#if related.length}
        {#each related as incident (incident.id)}
          <a href={incident.url} target="_blank" rel="noopener noreferrer"><span>{incident.title}</span><small>{incidentStates[incident.state] || incident.state}</small></a>
        {/each}
      {:else}<p>过去 90 天没有与此服务相关的事故记录。</p>{/if}
    </div>
  {/if}
</article>

<style>
  .monitor-card { padding: 24px; border: 1px solid #313131; border-radius: 16px; background: #181818; }
  .heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  h3 { margin: 0; color: #FFF; font-size: 18px; line-height: 28px; font-weight: 600; text-wrap: balance; }
  p { margin: 4px 0 0; color: #A3A3A3; font-size: 14px; line-height: 20px; text-wrap: pretty; }
  .data-error { margin-top: 12px; padding: 12px; border: 1px solid #FBBF24; border-radius: 8px; color: #FBBF24; }
  .monitor-meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px 16px; margin-top: 16px; color: #737373; font-size: 12px; line-height: 16px; }
  strong { color: #A3A3A3; font-family: 'Geist Mono',monospace; font-weight: 400; }
  .expand { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: 16px; padding: 12px 0 0; border: 0; border-top: 1px solid #313131; background: transparent; color: #A3A3A3; font: inherit; font-size: 14px; line-height: 20px; cursor: pointer; }
  .expand:hover { color: #FFF; }
  .expand :global(svg) { transition: transform 500ms cubic-bezier(.22,1,.36,1); }
  .expand :global(svg.rotated) { transform: rotate(180deg); }
  .related { margin-top: 12px; animation: enter 500ms cubic-bezier(.22,1,.36,1); }
  .related a { display: flex; justify-content: space-between; gap: 16px; padding: 12px; border-radius: 8px; color: #A3A3A3; font-size: 14px; line-height: 20px; text-decoration: none; }
  .related a:hover { background: #272727; color: #FFF; }
  small { color: #737373; white-space: nowrap; }
  @keyframes enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 600px) { .monitor-card { padding: 16px; } .heading { flex-direction: column; } }
  @media (prefers-reduced-motion: reduce) { .related { animation: none; } }
</style>
