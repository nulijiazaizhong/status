<script lang="ts">
  import { ArrowUpRight, CaretDown, Wrench } from 'phosphor-svelte';
  import IncidentItem from './IncidentItem.svelte';
  import { reveal } from '../actions/reveal';
  import { formatDateTime } from '../format';
  import { isOngoing, maintenanceStates } from '../status';
  import type { Incident, Maintenance } from '../types';

  let { incidents, maintenances, timezone }: { incidents: Incident[]; maintenances: Maintenance[]; timezone: string } = $props();
  let showAll = $state(false);
  const active = $derived(incidents.filter(isOngoing));
  const total = $derived(active.length + maintenances.length);
</script>

{#if total}
<section class="notices" id="notices" aria-labelledby="notices-title" use:reveal>
  <div class="heading"><div><span class="kicker">需要关注</span><h2 id="notices-title">当前事件与维护</h2></div><span>{total} 条通知</span></div>
  <div class="list">
    {#each (showAll ? active : active.slice(0, 2)) as incident (incident.id)}<IncidentItem {incident} {timezone} compact />{/each}
    {#each (showAll || !active.length ? maintenances : maintenances.slice(0, Math.max(0, 2 - active.length))) as maintenance (maintenance.id)}
      <article class="maintenance"><div class="type"><Wrench size={16} />计划维护<span>{maintenanceStates[maintenance.status]}</span></div><h3>{maintenance.title}</h3>{#if maintenance.description}<p>{maintenance.description}</p>{/if}<p class="affected">影响服务：{maintenance.monitors.map((monitor) => monitor.name).join('、')}</p><div class="window"><span>{formatDateTime(maintenance.startedAt, timezone)}</span><span>至 {formatDateTime(maintenance.endedAt, timezone)}</span></div><a href={maintenance.url} target="_blank" rel="noopener noreferrer">查看维护详情<ArrowUpRight size={16} /></a></article>
    {/each}
  </div>
  {#if total > 2}<button class="show-all" onclick={() => showAll = !showAll}>{showAll ? '收起事件' : `查看全部 ${total} 条事件`}<CaretDown size={16} /></button>{/if}
</section>
{/if}

<style>
  .notices { padding: 0 0 64px; scroll-margin-top: 24px; }
  .heading { display: flex; align-items: end; justify-content: space-between; margin-bottom: 24px; }
  .kicker { color: #FBBF24; font-size: 12px; line-height: 16px; }
  h2 { margin: 8px 0 0; color: #FFF; font-size: 24px; line-height: 32px; font-weight: 600; }
  .heading > span { color: #737373; font-size: 12px; line-height: 16px; }
  .list { display: grid; gap: 16px; }
  .maintenance { padding: 24px; border: 1px solid #38BDF8; border-radius: 16px; background: #181818; }
  .type { display: flex; align-items: center; gap: 8px; color: #38BDF8; font-size: 12px; line-height: 16px; }
  .type span { margin-left: auto; }
  h3 { margin: 12px 0 0; color: #FFF; font-size: 18px; line-height: 28px; font-weight: 600; }
  p { margin: 8px 0 0; color: #A3A3A3; font-size: 14px; line-height: 20px; }
  .window { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 16px; color: #A3A3A3; font-family: 'Geist Mono','LXGW WenKai Mono',monospace; font-size: 12px; line-height: 16px; }
  a { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; color: #A3A3A3; font-size: 14px; line-height: 20px; text-decoration: none; }
  a:hover { color: #FFF; }
  .show-all { display: flex; align-items: center; gap: 8px; margin: 16px auto 0; padding: 8px 12px; border: 1px solid #313131; border-radius: 8px; background: #181818; color: #A3A3A3; font: inherit; font-size: 14px; line-height: 20px; cursor: pointer; }
  .show-all:hover { background: #272727; color: #FFF; }
</style>
