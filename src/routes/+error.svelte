<script lang="ts">
  import { page } from '$app/state';
  import { ArrowLeft, Heartbeat } from 'phosphor-svelte';
</script>

<svelte:head><title>页面未找到｜服务状态</title><meta name="robots" content="noindex" /></svelte:head>
<main class="error-page">
  <Heartbeat size={32} weight="bold" />
  <p class="code">{page.status}</p>
  <h1>{page.status === 404 ? '这里没有需要查看的状态' : '页面暂时无法显示'}</h1>
  <p>你访问的地址不存在或已经移动，服务运行状态仍可在主页查看。</p>
  <a href="/"><ArrowLeft size={20} />返回服务状态</a>
</main>

<style>
  .error-page { width: min(100% - 32px,680px); margin: 0 auto; padding: 96px 0; color: #A3A3A3; }
  .code { margin: 32px 0 0; color: #737373; font-family: 'Geist Mono',monospace; font-size: 14px; line-height: 20px; }
  h1 { margin: 16px 0 0; color: #FFF; font-size: 48px; line-height: 1; font-weight: 600; text-wrap: balance; }
  p:not(.code) { margin: 24px 0; font-size: 18px; line-height: 28px; }
  a { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #313131; border-radius: 8px; background: #FFF; color: #000; font-size: 16px; line-height: 24px; font-weight: 600; text-decoration: none; }
  @media (max-width: 600px) { h1 { font-size: 36px; line-height: 40px; } }
</style>
