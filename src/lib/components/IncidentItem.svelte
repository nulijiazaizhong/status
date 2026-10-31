<script lang="ts">
  import { ArrowClockwise, ArrowUpRight, CaretDown } from 'phosphor-svelte';
  import { getIncident } from '$lib/api';
  import { formatDate, formatDateTime, formatDuration } from '$lib/format';
  import { incidentStates } from '$lib/status';
  import type { Incident, IncidentDetail } from '$lib/types';

  let { incident, timezone, compact = false }: { incident: Incident; timezone: string; compact?: boolean } = $props();
  let expanded = $state(false);
  let loading = $state(false);
  let detail = $state<IncidentDetail | null>(null);
  let error = $state('');

  async function toggle() {
    expanded = !expanded;
    if (expanded && !detail && !loading) await load();
  }
  async function load() {
    loading = true; error = '';
    try { detail = await getIncident(incident.id); }
    catch (reason) { error = reason instanceof Error ? reason.message : '事故进展加载失败。'; }
    finally { loading = false; }
  }
</script>

<article class:compact class="incident">
  <div class="top"><span class="state">{incidentStates[incident.state] || incident.state}</span><time>{formatDate(incident.startedAt, timezone)}</time></div>
  <h3>{incident.title}</h3>
  <p class="affected">影响服务：{incident.monitors.map((monitor) => monitor.name).join('、') || '待确认'}</p>
  {#if compact && incident.latestUpdate}<p class="latest"><strong>{incidentStates[incident.latestUpdate.state] || incident.latestUpdate.state}</strong>{incident.latestUpdate.comment}</p>{/if}
  <div class="facts"><span>持续 {formatDuration(incident.startedAt, incident.endedAt)}</span>{#if !compact}<span>{incident.state === 'RESOLVED' ? '事故已关闭，完整处理过程可展开查看。' : '工程团队正在处理，进展将持续更新。'}</span>{/if}</div>
  <div class="actions"><button aria-expanded={expanded} aria-controls={`incident-${incident.id}`} onclick={toggle}>{expanded ? '收起时间线' : '查看处理时间线'}<CaretDown size={16} class={expanded ? 'rotated' : ''} /></button><a href={incident.url} target="_blank" rel="noopener noreferrer" aria-label={`在 Kener 查看 ${incident.title}`}><ArrowUpRight size={16} /></a></div>
  {#if expanded}
    <div class="timeline" id={`incident-${incident.id}`}>
      {#if loading}<div class="comment-skeleton"></div><div class="comment-skeleton short"></div>
      {:else if error}<div class="error" role="alert">{error}<button onclick={load}><ArrowClockwise size={16} />重试</button></div>
      {:else if detail?.comments.length}
        <ol>{#each detail.comments as comment (comment.id)}<li><div class="marker"></div><div><div class="comment-meta"><strong>{incidentStates[comment.state] || comment.state}</strong><time>{formatDateTime(comment.timestamp, timezone)}</time></div><p>{comment.comment}</p></div></li>{/each}</ol>
      {:else}<p class="no-comments">暂时没有公开处理进展，后续评论会显示在这里。</p>{/if}
    </div>
  {/if}
</article>

<style>
  .incident { padding: 24px; border: 1px solid #313131; border-radius: 16px; background: #181818; }
  .top, .facts, .actions, .comment-meta { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 16px; }
  .state { color: #FBBF24; font-size: 12px; line-height: 16px; font-weight: 600; }
  time, .facts { color: #737373; font-size: 12px; line-height: 16px; }
  h3 { margin: 12px 0 0; color: #FFF; font-size: 18px; line-height: 28px; font-weight: 600; text-wrap: balance; }
  .affected { margin: 8px 0 0; color: #A3A3A3; font-size: 14px; line-height: 20px; }
  .latest { margin: 16px 0 0; padding: 12px; border-radius: 8px; background: #1F1F1F; color: #A3A3A3; font-size: 14px; line-height: 20px; }
  .latest strong { display: block; margin-bottom: 4px; color: #FFF; font-weight: 500; }
  .facts { margin-top: 16px; }
  .actions { margin-top: 16px; }
  button, .actions a { display: inline-flex; align-items: center; gap: 8px; padding: 8px 0; border: 0; border-radius: 8px; background: transparent; color: #A3A3A3; font: inherit; font-size: 14px; line-height: 20px; cursor: pointer; }
  button:hover, .actions a:hover { color: #FFF; }
  .actions :global(svg) { transition: transform 500ms cubic-bezier(.22,1,.36,1); }
  .actions :global(svg.rotated) { transform: rotate(180deg); }
  .timeline { margin-top: 16px; padding-top: 16px; border-top: 1px solid #313131; animation: enter 500ms cubic-bezier(.22,1,.36,1); }
  ol { margin: 0; padding: 0; list-style: none; }
  li { display: grid; grid-template-columns: 12px 1fr; gap: 16px; padding-bottom: 24px; }
  .marker { width: 8px; height: 8px; margin-top: 8px; border-radius: 999px; background: #737373; box-shadow: 0 0 0 4px #272727; }
  .comment-meta strong { color: #FFF; font-size: 14px; line-height: 20px; font-weight: 500; }
  li p, .no-comments { margin: 8px 0 0; color: #A3A3A3; font-size: 14px; line-height: 20px; white-space: pre-wrap; }
  .error { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: #FB7185; font-size: 14px; line-height: 20px; }
  .comment-skeleton { height: 64px; margin-bottom: 12px; border-radius: 8px; background: #272727; }
  .comment-skeleton.short { width: 70%; }
  @keyframes enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @media (prefers-reduced-motion: reduce) { .timeline { animation: none; } }
</style>
