<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowLeft, ArrowRight, Wrench } from 'phosphor-svelte';
  import IncidentItem from './IncidentItem.svelte';
  import { reveal } from '../actions/reveal';
  import { formatHistoryDate } from '../format';
  import { incidentStates, maintenanceStates } from '../status';
  import type { AffectedMonitor, Incident, Maintenance } from '../types';

  type CalendarEvent = {
    key: string;
    kind: 'incident' | 'maintenance';
    title: string;
    status: string;
    startedAt: number;
    endedAt: number | null;
    date: string;
    description: string | null;
    monitors: AffectedMonitor[];
    incident?: Incident;
  };

  let { incidents, maintenances, maintenanceHistory, timezone }: {
    incidents: Incident[];
    maintenances: Maintenance[];
    maintenanceHistory: Maintenance[];
    timezone: string;
  } = $props();

  function dateParts(timestamp: number) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(timestamp * 1000));
    return Object.fromEntries(parts.map((part) => [part.type, Number(part.value)]));
  }

  function dateKey(timestamp: number) {
    const parts = dateParts(timestamp);
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  }

  const events = $derived.by(() => {
    const result: CalendarEvent[] = [];
    for (const incident of incidents) result.push({
      key: `incident-${incident.id}`, kind: 'incident', title: incident.title, status: incident.state,
      startedAt: incident.startedAt, endedAt: incident.endedAt, date: dateKey(incident.startedAt),
      description: null, monitors: incident.monitors, incident,
    });
    for (const maintenance of [...maintenances, ...maintenanceHistory]) result.push({
      key: `maintenance-${maintenance.id}`, kind: 'maintenance', title: maintenance.title, status: maintenance.status,
      startedAt: maintenance.startedAt, endedAt: maintenance.endedAt, date: dateKey(maintenance.startedAt),
      description: maintenance.description, monitors: maintenance.monitors,
    });
    return result.sort((a, b) => b.startedAt - a.startedAt);
  });
  const eventsByDate = $derived.by(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const daily = map.get(event.date) || [];
      daily.push(event);
      map.set(event.date, daily);
    }
    return map;
  });
  const initial = dateParts(Math.floor(Date.now() / 1000));
  let cursor = $state({ year: initial.year, month: initial.month - 1 });
  let selectedDate = $state('');
  const monthLabel = $derived(new Intl.DateTimeFormat('zh-CN', { timeZone: 'UTC', year: 'numeric', month: 'long' }).format(Date.UTC(cursor.year, cursor.month, 1)));
  const days = $derived.by(() => {
    const first = Date.UTC(cursor.year, cursor.month, 1);
    const offset = (new Date(first).getUTCDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => {
      const timestamp = Math.floor((first + (index - offset) * 86400000) / 1000);
      const key = dateKey(timestamp);
      return { key, day: dateParts(timestamp).day, inMonth: dateParts(timestamp).month === cursor.month + 1, events: eventsByDate.get(key) || [] };
    });
  });
  const selectedEvents = $derived(eventsByDate.get(selectedDate) || []);
  const isCurrentMonth = $derived(cursor.year === initial.year && cursor.month === initial.month - 1);

  onMount(() => {
    selectedDate = events[0]?.date || dateKey(Math.floor(Date.now() / 1000));
    if (events[0]) {
      const parts = dateParts(events[0].startedAt);
      cursor = { year: parts.year, month: parts.month - 1 };
    }
  });

  function moveMonth(offset: number) {
    const date = new Date(Date.UTC(cursor.year, cursor.month + offset, 1));
    cursor = { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  }

  function statusLabel(event: CalendarEvent) {
    return event.kind === 'incident' ? incidentStates[event.status] || event.status : maintenanceStates[event.status as Maintenance['status']] || event.status;
  }
</script>

<section class="event-section" id="events" aria-labelledby="events-title" use:reveal>
  <div class="heading"><h2 id="events-title">事件日历</h2><div class="month-actions"><button aria-label="上一个月份" onclick={() => moveMonth(-1)}><ArrowLeft size={16} /></button><strong>{monthLabel}</strong><button aria-label="下一个月份" disabled={isCurrentMonth} onclick={() => moveMonth(1)}><ArrowRight size={16} /></button></div></div>
  <div class="calendar-panel">
    <div class="weekdays" aria-hidden="true">{#each ['一','二','三','四','五','六','日'] as day}<span>{day}</span>{/each}</div>
    <div class="days">
      {#each days as day (day.key)}
        <button
          class:outside={!day.inMonth}
          class:selected={selectedDate === day.key}
          class:has-incident={day.events.some((event) => event.kind === 'incident')}
          class:has-maintenance={day.events.some((event) => event.kind === 'maintenance')}
          disabled={!day.events.length}
          aria-label={`${day.key}，${day.events.length} 条事件`}
          onclick={() => selectedDate = day.key}
        ><span>{day.day}</span>{#if day.events.length}<i></i>{/if}</button>
      {/each}
    </div>
  </div>

  <div class="selected-events">
    <div class="selected-heading"><h3>{selectedDate ? formatHistoryDate(selectedDate) : '近期事件'}</h3><span>{selectedEvents.length} 条事件</span></div>
    {#if selectedEvents.length}
      <div class="event-list">
        {#each selectedEvents as event (event.key)}
          {#if event.incident}
            <IncidentItem incident={event.incident} {timezone} />
          {:else}
            <article class="maintenance-event">
              <div class="event-type"><Wrench size={16} />维护公告<span>{statusLabel(event)}</span></div>
              <h3>{event.title}</h3>
              <p class="affected">影响服务：{event.monitors.map((monitor) => monitor.name).join('、')}</p>
              {#if event.description}<p class="description">{event.description}</p>{/if}
            </article>
          {/if}
        {/each}
      </div>
    {:else}
      <div class="empty"><p>这一天没有事故或维护记录。</p><span>带有标记的日期可以查看公告和事故时间线。</span></div>
    {/if}
  </div>
</section>

<style>
  .event-section { padding: 0 0 64px; scroll-margin-top: 24px; }
  .heading, .month-actions, .selected-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .heading { margin-bottom: 24px; }
  h2 { margin: 0; color: #FFF; font-size: 24px; line-height: 32px; font-weight: 600; }
  .month-actions strong { min-width: 96px; color: #A3A3A3; font-size: 14px; line-height: 20px; font-weight: 500; text-align: center; }
  .month-actions button { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; border: 1px solid #313131; border-radius: 8px; background: #181818; color: #A3A3A3; cursor: pointer; }
  .month-actions button:hover:not(:disabled) { background: #272727; color: #FFF; }
  .month-actions button:disabled { opacity: .35; cursor: default; }
  .calendar-panel { padding: 16px; border: 1px solid #313131; border-radius: 16px; background: #181818; }
  .weekdays, .days { display: grid; grid-template-columns: repeat(7,minmax(0,1fr)); gap: 8px; }
  .weekdays { margin-bottom: 8px; color: #737373; font-size: 12px; line-height: 16px; text-align: center; }
  .days button { position: relative; display: flex; align-items: center; justify-content: center; aspect-ratio: 1.35; min-width: 0; padding: 0; border: 1px solid transparent; border-radius: 8px; background: transparent; color: #A3A3A3; font-family: 'Geist Mono',monospace; font-size: 14px; cursor: default; }
  .days button.has-incident, .days button.has-maintenance { border-color: #313131; background: #1F1F1F; color: #FFF; cursor: pointer; }
  .days button.has-incident:hover, .days button.has-maintenance:hover { background: #313131; }
  .days button.selected { border-color: #FFF; }
  .days button.outside { opacity: .35; }
  .days button i { position: absolute; bottom: 8px; width: 4px; height: 4px; border-radius: 999px; background: #38BDF8; }
  .days button.has-incident i { background: #FB7185; }
  .selected-events { margin-top: 32px; }
  .selected-heading { margin-bottom: 16px; }
  .selected-heading h3 { margin: 0; color: #FFF; font-size: 18px; line-height: 28px; font-weight: 600; }
  .selected-heading span { color: #737373; font-size: 12px; line-height: 16px; }
  .event-list { display: grid; gap: 16px; }
  .maintenance-event { padding: 24px; border: 1px solid #313131; border-radius: 16px; background: #181818; }
  .event-type { display: flex; align-items: center; gap: 8px; color: #38BDF8; font-size: 12px; line-height: 16px; }
  .event-type span { margin-left: auto; color: #A3A3A3; }
  .maintenance-event h3 { margin: 12px 0 0; color: #FFF; font-size: 18px; line-height: 28px; font-weight: 600; }
  .maintenance-event p { margin: 8px 0 0; color: #A3A3A3; font-size: 14px; line-height: 20px; }
  .description { padding-top: 16px; white-space: pre-wrap; }
  .empty { padding: 32px; border: 1px solid #313131; border-radius: 16px; background: #181818; text-align: center; }
  .empty p { margin: 0; color: #FFF; font-size: 16px; line-height: 24px; }
  .empty span { display: block; margin-top: 8px; color: #737373; font-size: 14px; line-height: 20px; }
  @media (max-width: 600px) {
    .event-section { padding-bottom: 48px; }
    .heading { align-items: flex-start; flex-direction: column; }
    .month-actions { width: 100%; }
    .calendar-panel { padding: 8px; }
    .weekdays, .days { gap: 4px; }
    .days button { aspect-ratio: 1; font-size: 12px; }
    .days button i { bottom: 4px; }
    .maintenance-event { padding: 16px; }
  }
</style>
