<script lang="ts">
  import { CloudSlash, ArrowClockwise } from 'phosphor-svelte';
  let { message, retry, stale = false }: { message: string; retry?: () => void; stale?: boolean } = $props();
</script>

<div class:stale class="error" role={stale ? 'status' : 'alert'}>
  <CloudSlash size={20} />
  <span>{message}</span>
  {#if retry}<button onclick={retry}><ArrowClockwise size={16} />重试</button>{/if}
</div>

<style>
  .error { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 16px; border: 1px solid #FB7185; border-radius: 16px; background: #181818; color: #A3A3A3; font-size: 14px; line-height: 20px; }
  .error > span { flex: 1; min-width: 200px; }
  .stale { border-color: #FBBF24; }
  button { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #313131; border-radius: 8px; background: #272727; color: #FFF; font: inherit; font-weight: 600; cursor: pointer; }
  button:hover { background: #313131; }
  button:active { transform: scale(.98); }
</style>
