<script lang="ts">
  import MonitorCard from './MonitorCard.svelte';
  import { reveal } from '$lib/actions/reveal';
  import type { Incident, PublicMonitor } from '$lib/types';

  let { monitors, incidents, timezone }: { monitors: PublicMonitor[]; incidents: Incident[]; timezone: string } = $props();
  const groups = $derived.by(() => {
    const result: Array<{ name: string; monitors: PublicMonitor[] }> = [];
    for (const monitor of monitors) {
      let group = result.find((item) => item.name === monitor.category);
      if (!group) { group = { name: monitor.category, monitors: [] }; result.push(group); }
      group.monitors.push(monitor);
    }
    return result;
  });
</script>

<section class="section" id="services" aria-labelledby="services-title" use:reveal>
  <div class="section-heading"><h2 id="services-title">系统状态</h2><span class="count">近 30 天 · {monitors.length} 项监控</span></div>
  {#if monitors.length}
    {#each groups as group (group.name)}
      <div class="group"><h3>{group.name}</h3><div class="cards">{#each group.monitors as monitor (monitor.tag)}<MonitorCard {monitor} {incidents} {timezone} />{/each}</div></div>
    {/each}
  {:else}<div class="empty"><h3>尚未配置公开监控项</h3><p>请在 Kener 首页关联已启用且非隐藏的监控项，数据接入后会自动显示在这里。</p></div>{/if}
</section>

<style>
  .section { padding: 0 0 64px; scroll-margin-top: 24px; }
  .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
  h2 { margin: 0; color: #FFF; font-size: 24px; line-height: 32px; font-weight: 600; text-wrap: balance; }
  .count { color: #737373; font-family: 'Geist Mono',monospace; font-size: 12px; line-height: 16px; }
  .group + .group { margin-top: 32px; }
  h3 { margin: 0 0 12px; color: #737373; font-size: 12px; line-height: 16px; font-weight: 500; }
  .cards { display: grid; gap: 1px; overflow: hidden; border: 1px solid #313131; border-radius: 16px; background: #313131; }
  .empty { padding: 32px; border: 1px solid #313131; border-radius: 16px; background: #181818; }
  .empty h3 { color: #FFF; font-size: 18px; line-height: 28px; }
  .empty p { margin: 8px 0 0; color: #A3A3A3; font-size: 14px; line-height: 20px; }
  @media (max-width: 600px) { .section { padding-bottom: 48px; } .section-heading { align-items: flex-start; flex-direction: column; gap: 8px; } }
</style>
