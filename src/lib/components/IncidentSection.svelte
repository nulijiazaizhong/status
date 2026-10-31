<script lang="ts">
  import { CaretDown, CheckCircle } from 'phosphor-svelte';
  import IncidentItem from './IncidentItem.svelte';
  import { reveal } from '../actions/reveal';
  import { isOngoing } from '../status';
  import type { Incident } from '../types';

  let { incidents, timezone }: { incidents: Incident[]; timezone: string } = $props();
  let showAll = $state(false);
  const resolved = $derived(incidents.filter((incident) => !isOngoing(incident)));
</script>

<section class="section" id="incidents" aria-labelledby="incidents-title" use:reveal>
  <div class="heading"><div><span class="kicker">过去 90 天</span><h2 id="incidents-title">事故记录与处理过程</h2></div>{#if resolved.length}<span>{resolved.length} 条记录</span>{/if}</div>
  {#if resolved.length}
    <div class="list">{#each (showAll ? resolved : resolved.slice(0, 4)) as incident (incident.id)}<IncidentItem {incident} {timezone} />{/each}</div>
    {#if resolved.length > 4}<button onclick={() => showAll = !showAll}>{showAll ? '收起记录' : '查看更早的事故'}<CaretDown size={16} /></button>{/if}
  {:else}<div class="empty"><CheckCircle size={32} /><h3>过去 90 天没有事故记录</h3><p>监控数据仍在持续收集，服务历史可在上方查看。</p><a href="#services">查看服务历史</a></div>{/if}
</section>

<style>
  .section { padding: 80px 0; }
  .heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 40px; }
  .kicker { color: #737373; font-size: 12px; line-height: 16px; }
  h2 { margin: 8px 0 0; color: #FFF; font-size: 24px; line-height: 32px; font-weight: 600; text-wrap: balance; }
  .heading > span { color: #737373; font-size: 12px; line-height: 16px; }
  .list { display: grid; gap: 16px; }
  button { display: flex; align-items: center; gap: 8px; margin: 24px auto 0; padding: 8px 12px; border: 1px solid #313131; border-radius: 8px; background: #181818; color: #A3A3A3; font: inherit; font-size: 14px; line-height: 20px; cursor: pointer; }
  button:hover { background: #272727; color: #FFF; }
  .empty { padding: 48px 24px; border: 1px solid #313131; border-radius: 16px; background: #181818; text-align: center; color: #34D399; }
  .empty h3 { margin: 16px 0 0; color: #FFF; font-size: 18px; line-height: 28px; font-weight: 600; }
  .empty p { margin: 8px auto 0; color: #A3A3A3; font-size: 14px; line-height: 20px; }
  .empty a { display: inline-block; margin-top: 24px; color: #FFF; font-size: 14px; line-height: 20px; }
  @media (max-width: 600px) { .section { padding: 64px 0; } }
</style>
