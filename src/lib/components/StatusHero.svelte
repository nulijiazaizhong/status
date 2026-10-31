<script lang="ts">
  import { Clock } from 'phosphor-svelte';
  import StatusIcon from './StatusIcon.svelte';
  import { formatTime } from '../format';
  import { summaryStatus } from '../status';
  import type { StatusData } from '../types';

  let { data, hasActiveNotices }: { data: StatusData; hasActiveNotices: boolean } = $props();
  const content = $derived(summaryStatus[data.summary.status]);
</script>

<section class="hero" aria-labelledby="overall-title">
  <div class="icon" class:attention={hasActiveNotices}><StatusIcon status={data.summary.status} size={40} /></div>
  <h1 id="overall-title">{content.title}</h1>
  <p class="summary">{content.description}</p>
  <div class="meta"><Clock size={16} />更新于 {formatTime(data.generatedAt, data.timezone)}<span aria-hidden="true">·</span>每 60 秒自动刷新</div>
</section>

<style>
  .hero { padding: 48px 0 64px; text-align: center; }
  .icon { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; margin-bottom: 24px; border: 1px solid #313131; border-radius: 999px; background: #181818; }
  h1 { max-width: 680px; margin: 0 auto; color: #FFF; font-size: 36px; line-height: 40px; letter-spacing: -.03em; font-weight: 600; text-wrap: balance; }
  .summary { max-width: 680px; margin: 16px auto 0; color: #A3A3A3; font-size: 16px; line-height: 24px; text-wrap: pretty; }
  .meta { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 16px; color: #737373; font-family: 'Geist Mono','LXGW WenKai Mono',monospace; font-size: 12px; line-height: 16px; }
  @media (max-width: 600px) { .hero { padding: 40px 0 48px; } .icon { width: 48px; height: 48px; } }
</style>
