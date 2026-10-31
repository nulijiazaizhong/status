<script lang="ts">
  import StatusIcon from './StatusIcon.svelte';
  import { serviceStatus } from '../status';
  import type { ServiceStatus } from '../types';

  let { status, label }: { status: ServiceStatus; label?: string } = $props();
</script>

<span class="badge" style={`--status-color: ${serviceStatus[status].color}`}>
  <StatusIcon {status} size={16} />
  {label || serviceStatus[status].label}
</span>

<style>
  .badge { display: inline-flex; align-items: center; gap: 8px; width: fit-content; padding: 4px 8px; border: 1px solid #313131; border-radius: 999px; color: var(--status-color); background: #181818; font-size: 12px; line-height: 16px; font-weight: 500; white-space: nowrap; }
</style>
