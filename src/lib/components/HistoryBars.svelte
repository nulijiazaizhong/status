<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowClockwise } from 'phosphor-svelte';
  import { getHistory } from '$lib/api';
  import { formatHistoryDate, formatUptime } from '$lib/format';
  import { serviceStatus } from '$lib/status';
  import type { HistoryData, HistoryDay } from '$lib/types';
  import DayTooltip from './DayTooltip.svelte';

  let { tag, timezone }: { tag: string; timezone: string } = $props();
  let root: HTMLDivElement;
  let data = $state<HistoryData | null>(null);
  let loading = $state(true);
  let error = $state('');
  let selected = $state<HistoryDay | null>(null);
  let days = $state(30);

  async function load() {
    loading = true;
    error = '';
    try {
      data = await getHistory(tag, days);
    } catch (reason) {
      error = reason instanceof Error ? reason.message : '历史数据加载失败。';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        void load();
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(root);
    return () => observer.disconnect();
  });
</script>

<div class="history" bind:this={root}>
  {#if loading && !data}
    <div class="history-skeleton" aria-label={`正在加载 ${days} 天历史`} role="status">{#each Array(days) as _}<span></span>{/each}</div>
  {:else if error && !data}
    <div class="history-error" role="alert"><span>{error}</span><button onclick={load}><ArrowClockwise size={16} />重试</button></div>
  {:else if data}
    <div class="range"><span>过去 {data.days} 天</span><span>{formatUptime(data.uptime)}</span></div>
    <div class="bars" role="group" aria-label={`${tag} 过去 ${data.days} 天每日状态`}>
      {#each data.history as day}
        <button
          class="day"
          style={`--day-color: ${serviceStatus[day.status].color}`}
          aria-label={`${formatHistoryDate(day.date)}，${serviceStatus[day.status].label}，${formatUptime(day.uptime)}`}
          onmouseenter={() => selected = day}
          onfocus={() => selected = day}
          onclick={() => selected = day}
        ></button>
      {/each}
    </div>
    <div class="dates"><span>{data.days} 天前</span><span>今天</span></div>
    {#if selected}<DayTooltip day={selected} />{/if}
    {#if data.stale}<p class="stale">当前展示缓存历史数据。</p>{/if}
  {/if}
</div>

<style>
  .history { margin-top: 24px; }
  .range, .dates { display: flex; justify-content: space-between; gap: 16px; color: #737373; font-size: 12px; line-height: 16px; }
  .range { margin-bottom: 12px; color: #A3A3A3; }
  .range span:last-child { color: #FFF; font-family: 'Geist Mono',monospace; }
  .bars, .history-skeleton { display: flex; gap: 2px; width: 100%; }
  .day, .history-skeleton span { flex: 1 1 0; min-width: 0; height: 32px; padding: 0; border: 0; border-radius: 2px; background: var(--day-color); cursor: pointer; transition: transform 300ms cubic-bezier(.22,1,.36,1), opacity 300ms cubic-bezier(.22,1,.36,1); }
  .day:hover, .day:focus-visible { transform: translateY(-4px); opacity: .8; }
  .dates { margin-top: 8px; }
  .history-skeleton span { --day-color: #272727; animation: pulse 1.5s cubic-bezier(.22,1,.36,1) infinite alternate; }
  .history-error { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 64px; padding: 12px; border: 1px solid #313131; border-radius: 8px; color: #A3A3A3; font-size: 14px; line-height: 20px; }
  .history-error button { display: inline-flex; align-items: center; gap: 8px; padding: 8px; border: 0; border-radius: 8px; background: #272727; color: #FFF; font: inherit; cursor: pointer; }
  .stale { margin: 8px 0 0; color: #FBBF24; font-size: 12px; line-height: 16px; }
  @keyframes pulse { from { opacity: .35; } to { opacity: .8; } }
  @media (prefers-reduced-motion: reduce) { .history-skeleton span { animation: none; } .day { transition: none; } }
</style>
