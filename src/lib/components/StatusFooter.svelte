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
  <div class="footer-main">
    <div class="meta"><span>数据由 Kener 提供</span><span>每 60 秒自动更新</span><span>显示时区 {timezone}</span></div>
    <div class="links">
      {#if PUBLIC_HOME_URL}<a href={PUBLIC_HOME_URL} target="_blank" rel="noopener noreferrer">返回官网<ArrowUpRight size={16} /></a>{/if}
      {#if PUBLIC_SUBSCRIBE_URL}<a href={PUBLIC_SUBSCRIBE_URL} target="_blank" rel="noopener noreferrer">订阅更新<ArrowUpRight size={16} /></a>{/if}
      {#if PUBLIC_PRIVACY_URL}<a href={PUBLIC_PRIVACY_URL} target="_blank" rel="noopener noreferrer">隐私政策</a>{/if}
      {#if PUBLIC_TERMS_URL}<a href={PUBLIC_TERMS_URL} target="_blank" rel="noopener noreferrer">服务条款</a>{/if}
    </div>
  </div>
  {#if env.PUBLIC_COPYRIGHT}<div class="copyright">{env.PUBLIC_COPYRIGHT}</div>{/if}
  <div class="beian">
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">苏ICP备2025160641号-3</a>
    <span aria-hidden="true">|</span>
    <a href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=32120202010796" target="_blank" rel="noopener noreferrer">苏公网安备32120202010796号</a>
  </div>
</footer>

<style>
  footer { padding: 32px 0; border-top: 1px solid #272727; color: #737373; font-size: 12px; line-height: 16px; }
  .footer-main, .meta, .links, .beian { display: flex; flex-wrap: wrap; gap: 8px 16px; }
  .footer-main { justify-content: space-between; gap: 24px; }
  a { color: #A3A3A3; text-decoration: none; transition: color 300ms cubic-bezier(.22,1,.36,1); }
  a:hover { color: #FFF; }
  .links a { display: inline-flex; align-items: center; gap: 4px; }
  .copyright { margin-top: 24px; text-align: center; }
  .beian { align-items: center; justify-content: center; margin-top: 16px; }
</style>
