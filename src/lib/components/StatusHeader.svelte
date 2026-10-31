<script lang="ts">
  import { Heartbeat, ArrowUpRight, Bell } from 'phosphor-svelte';
  import { env } from '$env/dynamic/public';
  const PUBLIC_HOME_URL = env.PUBLIC_HOME_URL;
  const PUBLIC_SUBSCRIBE_URL = env.PUBLIC_SUBSCRIBE_URL;

  let { brand = '服务状态', logo = null }: { brand?: string; logo?: string | null } = $props();
</script>

<nav class="nav" aria-label="主导航">
  <a class="brand" href="/" aria-current="page">
    {#if logo}<img src={logo} alt="" />{:else}<Heartbeat size={20} weight="bold" />{/if}
    <span>{brand}</span>
    <span class="divider" aria-hidden="true"></span>
    <span class="current">服务状态</span>
  </a>
  <div class="actions">
    {#if PUBLIC_SUBSCRIBE_URL}
      <a class="subscribe" href={PUBLIC_SUBSCRIBE_URL} target="_blank" rel="noopener noreferrer"><Bell size={16} />订阅更新</a>
    {/if}
    {#if PUBLIC_HOME_URL}
      <a class="home" href={PUBLIC_HOME_URL} target="_blank" rel="noopener noreferrer">返回官网<ArrowUpRight size={16} /></a>
    {/if}
  </div>
</nav>

<style>
  .nav { position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 16px; width: fit-content; max-width: 100%; margin: 16px auto 0; padding: 8px 12px; border: 1px solid #313131; border-radius: 16px; background: rgba(24,24,24,.9); backdrop-filter: blur(16px); }
  a { display: inline-flex; align-items: center; gap: 8px; min-height: 32px; border-radius: 8px; color: #A3A3A3; font-size: 14px; line-height: 20px; font-weight: 600; text-decoration: none; transition: color 300ms cubic-bezier(.22,1,.36,1), background 300ms cubic-bezier(.22,1,.36,1); }
  a:hover { color: #FFF; }
  .brand { color: #FFF; }
  .brand img { width: 24px; height: 24px; border-radius: 4px; object-fit: contain; }
  .divider { width: 1px; height: 16px; background: #313131; }
  .current { color: #A3A3A3; font-weight: 400; }
  .actions { display: flex; gap: 8px; }
  .home, .subscribe { padding: 0 8px; }
  .home:hover, .subscribe:hover { background: #272727; }
  @media (max-width: 600px) { .current, .divider, .subscribe { display: none; } .nav { width: 100%; } }
</style>
