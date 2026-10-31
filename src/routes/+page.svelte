<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  const PUBLIC_STATUS_URL = env.PUBLIC_STATUS_URL;
  import { getCachedStatus, getStatus } from '$lib/api';
  import StatusHeader from '$lib/components/StatusHeader.svelte';
  import StatusHero from '$lib/components/StatusHero.svelte';
  import ActiveNoticeList from '$lib/components/ActiveNoticeList.svelte';
  import MonitorSection from '$lib/components/MonitorSection.svelte';
  import EventCalendar from '$lib/components/EventCalendar.svelte';
  import StatusFooter from '$lib/components/StatusFooter.svelte';
  import SkeletonCard from '$lib/components/SkeletonCard.svelte';
  import InlineError from '$lib/components/InlineError.svelte';
  import { isOngoing } from '$lib/status';
  import type { StatusData } from '$lib/types';

  let data = $state<StatusData | null>(null);
  let error = $state('');
  let loading = $state(true);
  let refreshing = $state(false);
  let announcement = $state('');
  const hasActiveNotices = $derived(Boolean(data && (data.maintenances.length || data.incidents.some(isOngoing))));

  async function refresh(background = false) {
    if (background) refreshing = true;
    else if (!data) loading = true;
    try {
      const next = await getStatus();
      if (data?.summary.status !== next.summary.status) announcement = `整体状态已更新：${next.summary.status}`;
      data = next;
      error = '';
    } catch (reason) {
      error = reason instanceof Error ? reason.message : '暂时无法获取最新状态。';
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  onMount(() => {
    const cached = getCachedStatus();
    if (cached) {
      data = cached;
      loading = false;
    }
    void refresh();
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (!timer && !document.hidden) timer = setInterval(() => void refresh(true), 60000);
    };
    const stop = () => { if (timer) clearInterval(timer); timer = undefined; };
    const visibility = () => { if (document.hidden) stop(); else { void refresh(true); start(); } };
    document.addEventListener('visibilitychange', visibility);
    start();
    return () => { stop(); document.removeEventListener('visibilitychange', visibility); };
  });
</script>

<svelte:head>
  <title>{env.PUBLIC_PAGE_TITLE || data?.page.title || '服务状态'}</title>
  <meta name="description" content={env.PUBLIC_META_DESCRIPTION || '查看各项服务的实时运行状态、历史可用率、维护计划与事故进展。'} />
  <meta name="theme-color" content="#000000" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={env.PUBLIC_PAGE_TITLE || data?.page.title || '服务状态'} />
  <meta property="og:description" content={env.PUBLIC_META_DESCRIPTION || '查看各项服务的实时运行状态、历史可用率、维护计划与事故进展。'} />
  <meta property="og:image" content={env.PUBLIC_OG_IMAGE_URL || (PUBLIC_STATUS_URL ? `${PUBLIC_STATUS_URL.replace(/\/$/, '')}/og-status.png` : '/og-status.png')} />
  <meta name="twitter:card" content="summary_large_image" />
  {#if PUBLIC_STATUS_URL}<link rel="canonical" href={PUBLIC_STATUS_URL} />{/if}
</svelte:head>

<a class="skip-link" href="#main-content">跳转至主内容</a>
<div class="page-shell">
  <StatusHeader brand={env.PUBLIC_BRAND_NAME || data?.page.header || '服务状态'} logo={env.PUBLIC_BRAND_LOGO || data?.page.logo} />
  <main id="main-content" tabindex="-1">
    {#if loading && !data}
      <SkeletonCard />
    {:else if data}
      <div class="sr-only" aria-live="polite">{announcement}</div>
      {#if data.stale}<div class="notice"><InlineError stale message={`当前展示缓存数据，更新时间为 ${new Date(data.generatedAt * 1000).toLocaleString('zh-CN')}。`} retry={() => refresh(true)} /></div>{/if}
      {#if error}<div class="notice"><InlineError message={`${error} 页面保留上次成功获取的数据。`} retry={() => refresh(true)} /></div>{/if}
      {#if data.warnings?.length}<div class="notice"><InlineError message="部分监控数据暂时不可用，页面显示其余成功获取的数据。" retry={() => refresh(true)} /></div>{/if}
      <StatusHero {data} {hasActiveNotices} />
      <ActiveNoticeList incidents={data.incidents} maintenances={data.maintenances} timezone={data.timezone} />
      <MonitorSection monitors={data.monitors} incidents={data.incidents} timezone={data.timezone} />
      <EventCalendar incidents={data.incidents} maintenances={data.maintenances} maintenanceHistory={data.maintenanceHistory} timezone={data.timezone} />
    {:else}
      <section class="fatal"><p class="kicker">状态数据不可用</p><h1>暂时无法获取最新状态</h1><p>{error || '状态服务尚未响应，请稍后重试。'}</p><InlineError message="这不代表所有业务服务均已宕机，仅表示当前无法读取监控数据。" retry={() => refresh()} /></section>
    {/if}
  </main>
  <StatusFooter timezone={data?.timezone || 'Asia/Shanghai'} />
</div>

<style>
  .notice { padding-top: 24px; }
  .fatal { padding: 96px 0; }
  .fatal .kicker { color: #FB7185; font-size: 14px; line-height: 20px; }
  .fatal h1 { max-width: 680px; margin: 16px 0 0; color: #FFF; font-size: 48px; line-height: 1; font-weight: 600; text-wrap: balance; }
  .fatal > p:not(.kicker) { max-width: 680px; margin: 24px 0; color: #A3A3A3; font-size: 18px; line-height: 28px; }
  @media (max-width: 600px) { .fatal { padding: 64px 0; } .fatal h1 { font-size: 36px; line-height: 40px; } }
</style>
