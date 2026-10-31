<script lang="ts">
  import { ArrowUpRight } from 'phosphor-svelte';
  import { env } from '$env/dynamic/public';
  const PUBLIC_HOME_URL = env.PUBLIC_HOME_URL;
  const PUBLIC_PRIVACY_URL = env.PUBLIC_PRIVACY_URL;
  const PUBLIC_SUBSCRIBE_URL = env.PUBLIC_SUBSCRIBE_URL;
  const PUBLIC_TERMS_URL = env.PUBLIC_TERMS_URL;
  let { timezone }: { timezone: string } = $props();
</script>

<footer>
  <div><span>数据由 Kener 提供</span><span>每 60 秒自动更新</span><span>显示时区 {timezone}</span></div>
  <div class="links">
    {#if PUBLIC_HOME_URL}<a href={PUBLIC_HOME_URL} target="_blank" rel="noopener noreferrer">返回官网<ArrowUpRight size={16} /></a>{/if}
    {#if PUBLIC_SUBSCRIBE_URL}<a href={PUBLIC_SUBSCRIBE_URL} target="_blank" rel="noopener noreferrer">订阅更新<ArrowUpRight size={16} /></a>{/if}
    {#if PUBLIC_PRIVACY_URL}<a href={PUBLIC_PRIVACY_URL} target="_blank" rel="noopener noreferrer">隐私政策</a>{/if}
    {#if PUBLIC_TERMS_URL}<a href={PUBLIC_TERMS_URL} target="_blank" rel="noopener noreferrer">服务条款</a>{/if}
  </div>
</footer>

<style>
  footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 24px; padding: 32px 0; border-top: 1px solid #272727; color: #737373; font-size: 12px; line-height: 16px; }
  footer > div { display: flex; flex-wrap: wrap; gap: 8px 16px; }
  .links a { display: inline-flex; align-items: center; gap: 4px; color: #A3A3A3; text-decoration: none; }
  .links a:hover { color: #FFF; }
</style>
