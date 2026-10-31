<script lang="ts">
  import { CheckCircle, XCircle, WarningCircle, Wrench, MinusCircle, CloudSlash } from 'phosphor-svelte';
  import type { ServiceStatus, SummaryStatus } from '../types';

  let { status, size = 24 }: { status: ServiceStatus | SummaryStatus | 'ERROR'; size?: number } = $props();
  const degraded = $derived(['DEGRADED', 'PARTIAL_OUTAGE'].includes(status));
  const down = $derived(['DOWN', 'MAJOR_OUTAGE'].includes(status));
  const maintenance = $derived(status === 'MAINTENANCE');
  const empty = $derived(['NO_DATA', 'EMPTY'].includes(status));
</script>

<span class:degraded class:down class:maintenance class:empty class="status-icon" aria-hidden="true">
  {#if status === 'UP' || status === 'OPERATIONAL'}
    <CheckCircle {size} weight="fill" />
  {:else if degraded}
    <WarningCircle {size} weight="fill" />
  {:else if down}
    <XCircle {size} weight="fill" />
  {:else if maintenance}
    <Wrench {size} weight="fill" />
  {:else if empty}
    <MinusCircle {size} weight="fill" />
  {:else}
    <CloudSlash {size} weight="fill" />
  {/if}
</span>

<style>
  .status-icon { display: inline-flex; flex: none; color: #34D399; }
  .degraded { color: #FBBF24; }
  .down { color: #FB7185; }
  .maintenance { color: #38BDF8; }
  .empty { color: #6B7280; }
</style>
