<script lang="ts">
  import { ArrowDown, ArrowRight, Clock } from 'phosphor-svelte';
  import StatusIcon from './StatusIcon.svelte';
  import { formatTime } from '$lib/format';
  import { summaryStatus } from '$lib/status';
  import type { StatusData } from '$lib/types';

  let { data, hasActiveNotices }: { data: StatusData; hasActiveNotices: boolean } = $props();
  const content = $derived(summaryStatus[data.summary.status]);
  const target = $derived(hasActiveNotices ? '#notices' : '#services');
</script>

<section class="hero" aria-labelledby="overall-title">
  <div class="eyebrow"><StatusIcon status={data.summary.status} size={20} />实时服务状态</div>
  <h1 id="overall-title">{content.title}</h1>
  <p class="summary">{data.summary.total} 项核心服务，{data.summary.operational} 项运行正常。{content.description}</p>
  <div class="meta"><Clock size={16} />数据更新于 {formatTime(data.generatedAt, data.timezone)}<span aria-hidden="true">·</span>每 60 秒自动刷新</div>
  <a class="primary" href={target}>{hasActiveNotices ? '查看最新进展' : '查看服务状态'}{#if hasActiveNotices}<ArrowRight size={20} />{:else}<ArrowDown size={20} />{/if}</a>
</section>

<style>
  .hero { padding: 80px 0 64px; }
  .eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; color: #A3A3A3; font-size: 14px; line-height: 20px; }
  h1 { max-width: 680px; margin: 0; background: linear-gradient(90deg,#FFF,#9B9B9B); background-clip: text; color: transparent; font-size: 48px; line-height: 1; letter-spacing: -.04em; font-weight: 600; text-wrap: balance; }
  .summary { max-width: 680px; margin: 24px 0 0; color: #A3A3A3; font-size: 18px; line-height: 28px; text-wrap: pretty; }
  .meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 16px; color: #737373; font-family: 'Geist Mono','LXGW WenKai Mono',monospace; font-size: 12px; line-height: 16px; }
  .primary { display: inline-flex; align-items: center; gap: 8px; margin-top: 32px; padding: 8px 12px; border: 1px solid #FFF; border-radius: 8px; background: #FFF; color: #000; font-size: 16px; line-height: 24px; font-weight: 600; text-decoration: none; transition: transform 300ms cubic-bezier(.22,1,.36,1), background 300ms cubic-bezier(.22,1,.36,1); }
  .primary:hover { transform: translateY(-2px); background: #D4D4D4; }
  .primary:active { transform: scale(.98); }
  @media (max-width: 600px) { .hero { padding: 64px 0; } h1 { font-size: 36px; line-height: 40px; } .summary { font-size: 16px; line-height: 24px; } }
</style>
