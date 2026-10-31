<script lang="ts">
  import { CaretDown, Wrench } from 'phosphor-svelte';
  import { reveal } from '$lib/actions/reveal';
  import { formatDateTime } from '$lib/format';
  import type { Maintenance } from '$lib/types';

  let { maintenances, timezone }: { maintenances: Maintenance[]; timezone: string } = $props();
  let expanded = $state<number | null>(null);

  function summary(description: string | null) {
    if (!description) return '本次维护已完成，服务监控已恢复正常。';
    const text = description.replace(/^#{1,6}\s+/gm, '').replace(/[*`]/g, '').replace(/\s+/g, ' ').trim();
    return text.length > 240 ? `${text.slice(0, 240)}…` : text;
  }
</script>

{#if maintenances.length}
<section class="section" id="maintenance-history" aria-labelledby="maintenance-title" use:reveal>
  <div class="heading"><div><span class="kicker">维护记录</span><h2 id="maintenance-title">维护公告与变更说明</h2></div><span>{maintenances.length} 条公告</span></div>
  <div class="list">
    {#each maintenances as maintenance (maintenance.id)}
      <article class="maintenance">
        <div class="type"><Wrench size={16} /><span>已完成</span><time>{formatDateTime(maintenance.startedAt, timezone)}</time></div>
        <h3>{maintenance.title}</h3>
        <p class="affected">影响服务：{maintenance.monitors.map((monitor) => monitor.name).join('、')}</p>
        <p class="summary">{expanded === maintenance.id && maintenance.description ? maintenance.description : summary(maintenance.description)}</p>
        <div class="window">维护窗口：{formatDateTime(maintenance.startedAt, timezone)} 至 {formatDateTime(maintenance.endedAt, timezone)}</div>
        {#if maintenance.description && maintenance.description.length > 240}
          <button aria-expanded={expanded === maintenance.id} onclick={() => expanded = expanded === maintenance.id ? null : maintenance.id}>{expanded === maintenance.id ? '收起公告' : '查看完整公告'}<CaretDown size={16} /></button>
        {/if}
      </article>
    {/each}
  </div>
</section>
{/if}

<style>
  .section { padding: 80px 0; scroll-margin-top: 24px; }
  .heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 40px; }
  .kicker { color: #737373; font-size: 12px; line-height: 16px; }
  h2 { margin: 8px 0 0; color: #FFF; font-size: 24px; line-height: 32px; font-weight: 600; text-wrap: balance; }
  .heading > span { color: #737373; font-size: 12px; line-height: 16px; }
  .list { display: grid; gap: 16px; }
  .maintenance { padding: 24px; border: 1px solid #313131; border-radius: 16px; background: #181818; }
  .type { display: flex; align-items: center; gap: 8px; color: #38BDF8; font-size: 12px; line-height: 16px; }
  .type time { margin-left: auto; color: #737373; }
  h3 { margin: 12px 0 0; color: #FFF; font-size: 18px; line-height: 28px; font-weight: 600; text-wrap: balance; }
  p { margin: 8px 0 0; color: #A3A3A3; font-size: 14px; line-height: 20px; text-wrap: pretty; }
  .summary { margin-top: 16px; white-space: pre-wrap; }
  .window { margin-top: 16px; color: #737373; font-family: 'Geist Mono','LXGW WenKai Mono',monospace; font-size: 12px; line-height: 16px; }
  button { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; padding: 8px 0; border: 0; background: transparent; color: #A3A3A3; font: inherit; font-size: 14px; line-height: 20px; cursor: pointer; }
  button:hover { color: #FFF; }
  @media (max-width: 600px) { .section { padding: 64px 0; } .maintenance { padding: 16px; } .type { flex-wrap: wrap; } .type time { margin-left: 0; width: 100%; } }
</style>
