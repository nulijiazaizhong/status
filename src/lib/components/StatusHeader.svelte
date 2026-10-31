<script lang="ts">
  import { Heartbeat, ArrowUpRight, Bell } from 'phosphor-svelte';
  import { env } from '$env/dynamic/public';
  const PUBLIC_HOME_URL = env.PUBLIC_HOME_URL;
  const PUBLIC_SUBSCRIBE_URL = env.PUBLIC_SUBSCRIBE_URL;

  let { brand = '服务状态', logo = null }: { brand?: string; logo?: string | null } = $props();
</script>

<nav class="nav" aria-label="主导航">
  <a class="brand" href="/" aria-current="page">
    {#if logo}<img src={logo} alt="" />{:else}<Heartbeat size={24} weight="bold" />{/if}
    <span>{brand}</span>
    <span class="current">服务状态</span>
  </a>
  <div class="actions">
    {#if PUBLIC_SUBSCRIBE_URL}<a href={PUBLIC_SUBSCRIBE_URL} target="_blank" rel="noopener noreferrer"><Bell size={16} />订阅更新</a>{/if}
    {#if PUBLIC_HOME_URL}<a href={PUBLIC_HOME_URL} target="_blank" rel="noopener noreferrer">返回官网<ArrowUpRight size={16} /></a>{/if}
  </div>
</nav>

<style>
  .nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 24px 0; }
  a { display: inline-flex; align-items: center; gap: 8px; min-height: 32px; padding: 0 8px; border-radius: 8px; color: #A3A3A3; font-size: 14px; line-height: 20px; font-weight: 500; text-decoration: none; transition: color 300ms cubic-bezier(.22,1,.36,1), background 300ms cubic-bezier(.22,1,.36,1); }
  a:hover { color: #FFF; background: #272727; }
  .brand { padding-left: 0; color: #FFF; font-weight: 600; }
  .brand:hover { background: transparent; }
  .brand img { width: 24px; height: 24px; border-radius: 4px; object-fit: contain; }
  .current { color: #737373; font-weight: 400; }
  .actions { display: flex; gap: 8px; }
  @media (max-width: 600px) { .current { display: none; } .actions a:first-child { display: none; } }
</style>
