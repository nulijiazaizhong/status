export const STATUS_PRIORITY = ['DOWN', 'DEGRADED', 'MAINTENANCE', 'NO_DATA', 'UP'];
export const STATUS_COUNTS = ['up', 'down', 'degraded', 'maintenance'];

export function dominantStatus(statuses) {
  return STATUS_PRIORITY.find((status) => statuses.includes(status)) || 'NO_DATA';
}

export function overallStatus(monitors, maintenanceCount = 0) {
  if (!monitors.length || monitors.every((monitor) => monitor.status === 'NO_DATA')) return 'EMPTY';
  if (monitors.some((monitor) => monitor.status === 'DOWN')) {
    return monitors.every((monitor) => monitor.status === 'DOWN') ? 'MAJOR_OUTAGE' : 'PARTIAL_OUTAGE';
  }
  if (monitors.some((monitor) => monitor.status === 'DEGRADED')) return 'DEGRADED';
  if (maintenanceCount > 0 || monitors.some((monitor) => monitor.status === 'MAINTENANCE')) return 'MAINTENANCE';
  return 'OPERATIONAL';
}

function tokenizeFormula(formula) {
  const tokens = formula.toLowerCase().replace(/\s+/g, '').match(/up|down|degraded|maintenance|[+\-*/()]/g) || [];
  const compact = formula.toLowerCase().replace(/\s+/g, '');
  if (tokens.join('') !== compact || !tokens.length) throw new Error('Invalid uptime formula');
  return tokens;
}

export function evaluateFormula(formula, values) {
  const tokens = tokenizeFormula(formula);
  const output = [];
  const operators = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
  let expectValue = true;

  for (const token of tokens) {
    if (STATUS_COUNTS.includes(token)) {
      if (!expectValue) throw new Error('Invalid uptime formula');
      output.push(values[token] || 0);
      expectValue = false;
    } else if (token === '(') {
      if (!expectValue) throw new Error('Invalid uptime formula');
      operators.push(token);
    } else if (token === ')') {
      if (expectValue) throw new Error('Invalid uptime formula');
      while (operators.length && operators.at(-1) !== '(') output.push(operators.pop());
      if (operators.pop() !== '(') throw new Error('Invalid uptime formula');
      expectValue = false;
    } else {
      if (expectValue) throw new Error('Invalid uptime formula');
      while (operators.length && operators.at(-1) !== '(' && precedence[operators.at(-1)] >= precedence[token]) {
        output.push(operators.pop());
      }
      operators.push(token);
      expectValue = true;
    }
  }
  if (expectValue) throw new Error('Invalid uptime formula');
  while (operators.length) {
    const operator = operators.pop();
    if (operator === '(') throw new Error('Invalid uptime formula');
    output.push(operator);
  }

  const stack = [];
  for (const token of output) {
    if (typeof token === 'number') stack.push(token);
    else {
      const right = stack.pop();
      const left = stack.pop();
      if (left === undefined || right === undefined) throw new Error('Invalid uptime formula');
      if (token === '/' && right === 0) return 0;
      stack.push(token === '+' ? left + right : token === '-' ? left - right : token === '*' ? left * right : left / right);
    }
  }
  if (stack.length !== 1 || !Number.isFinite(stack[0])) throw new Error('Invalid uptime formula');
  return stack[0];
}

export function calculateUptime(points, settings = {}) {
  const values = { up: 0, down: 0, degraded: 0, maintenance: 0 };
  for (const point of points) {
    const key = String(point.status || '').toLowerCase();
    if (STATUS_COUNTS.includes(key)) values[key] += 1;
  }
  const numerator = settings.uptime_formula_numerator || 'up + maintenance + degraded';
  const denominator = settings.uptime_formula_denominator || 'up + down + degraded + maintenance';
  let divisor;
  try {
    divisor = evaluateFormula(denominator, values);
    if (divisor === 0) return null;
    const result = (evaluateFormula(numerator, values) / divisor) * 100;
    return Math.round(Math.max(0, Math.min(100, result)) * 100) / 100;
  } catch {
    const fallbackTotal = values.up + values.down + values.degraded + values.maintenance;
    return fallbackTotal ? Math.round(((values.up + values.maintenance + values.degraded) / fallbackTotal) * 10000) / 100 : null;
  }
}

export function averageLatency(points) {
  const valid = points.map((point) => point.latency).filter((value) => Number.isFinite(value) && value >= 0);
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : null;
}

export function dayKey(timestamp, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp * 1000));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function recentDayKeys(days, timezone, now = Date.now()) {
  const current = dayKey(Math.floor(now / 1000), timezone);
  const noon = Date.parse(`${current}T12:00:00Z`);
  return Array.from({ length: days }, (_, index) => dayKey(Math.floor((noon - (days - index - 1) * 86400000) / 1000), 'UTC'));
}

export function aggregateHistory(points, days, timezone, settings, now = Date.now()) {
  const keys = recentDayKeys(days, timezone, now);
  const groups = new Map(keys.map((key) => [key, []]));
  for (const point of points) {
    const key = dayKey(point.timestamp, timezone);
    if (groups.has(key)) groups.get(key).push(point);
  }
  return keys.map((date) => {
    const daily = groups.get(date);
    return {
      date,
      status: daily.length ? dominantStatus(daily.map((point) => point.status || 'NO_DATA')) : 'NO_DATA',
      uptime: calculateUptime(daily, settings),
      averageLatency: averageLatency(daily),
    };
  });
}

export function historyUptime(points, days, timezone, settings, now = Date.now()) {
  const keys = new Set(recentDayKeys(days, timezone, now));
  return calculateUptime(points.filter((point) => keys.has(dayKey(point.timestamp, timezone))), settings);
}
