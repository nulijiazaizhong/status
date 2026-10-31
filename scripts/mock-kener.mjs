import http from 'node:http';

const now = () => Math.floor(Date.now() / 1000);
const monitors = [
  { tag: 'api', name: 'API 服务', description: '核心接口与身份认证服务', category_name: '核心服务' },
  { tag: 'web', name: 'Web 应用', description: '用户控制台与工作台', category_name: '核心服务' },
  { tag: 'gateway', name: '边缘网关', description: '全球流量接入与路由', category_name: '基础设施' },
  { tag: 'storage', name: '对象存储', description: '文件上传与内容分发', category_name: '基础设施' },
].map((monitor) => ({ ...monitor, status: 'ACTIVE', is_hidden: 'NO', monitor_settings_json: null, type_data: { secret: 'never-forward' } }));
const incident = { id: 42, title: 'API 响应时间升高', start_date_time: now() - 5400, end_date_time: null, state: 'MONITORING', monitors: [{ monitor_tag: 'api', impact: 'DEGRADED' }], url: 'http://127.0.0.1:8787/incidents/42' };
const comments = [
  { id: 2, state: 'MONITORING', comment: '扩容已完成，错误率恢复至正常水平，正在持续观察延迟变化。', timestamp: now() - 900 },
  { id: 1, state: 'INVESTIGATING', comment: '我们发现部分 API 请求延迟升高，正在检查上游连接池。', timestamp: now() - 5100 },
];

function points(tag, start, end) {
  const data = [];
  for (let timestamp = Math.ceil(start / 60) * 60; timestamp < end; timestamp += 60) {
    const age = now() - timestamp;
    let status = 'UP';
    if (tag === 'api' && age < 5400 && age > 1800) status = 'DEGRADED';
    if (tag === 'gateway' && age > 12 * 86400 && age < 11.9 * 86400) status = 'DOWN';
    data.push({ monitor_tag: tag, timestamp, status, latency: 110 + (timestamp % 97), type: 'REAL' });
  }
  return data;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  const scenario = process.env.MOCK_SCENARIO || 'normal';
  if (scenario === 'error') { res.writeHead(500); res.end('{}'); return; }
  if (scenario === 'unauthorized') { res.writeHead(401); res.end('{}'); return; }
  if (req.headers.authorization !== 'Bearer local-development-key') { res.writeHead(401); res.end('{}'); return; }
  res.setHeader('Content-Type', 'application/json');
  if (url.pathname === '/api/v4/pages/~home') {
    res.end(JSON.stringify({ page: { page_title: '服务状态', page_header: 'Northstar', page_subheader: '实时运行状态', page_logo: null, monitors: monitors.map((monitor, position) => ({ monitor_tag: monitor.tag, position })) } }));
  } else if (url.pathname === '/api/v4/monitors') {
    res.end(JSON.stringify({ monitors: [...monitors, { ...monitors[0], tag: 'hidden', is_hidden: 'YES' }] }));
  } else if (/^\/api\/v4\/monitors\/[^/]+\/data$/.test(url.pathname)) {
    const tag = url.pathname.split('/')[5];
    res.end(JSON.stringify({ data: points(tag, Number(url.searchParams.get('start_ts')), Number(url.searchParams.get('end_ts'))) }));
  } else if (url.pathname === '/api/v4/incidents') {
    res.end(JSON.stringify({ incidents: [incident, { ...incident, id: 31, title: '对象存储上传失败率升高', state: 'RESOLVED', start_date_time: now() - 12 * 86400, end_date_time: now() - 12 * 86400 + 2700, monitors: [{ monitor_tag: 'storage', impact: 'DOWN' }], url: 'http://127.0.0.1:8787/incidents/31' }] }));
  } else if (/^\/api\/v4\/incidents\/\d+$/.test(url.pathname)) {
    const id = Number(url.pathname.split('/').at(-1));
    res.end(JSON.stringify({ incident: { ...incident, id, state: id === 42 ? 'MONITORING' : 'RESOLVED', end_date_time: id === 42 ? null : now() - 12 * 86400 + 2700 } }));
  } else if (/^\/api\/v4\/incidents\/\d+\/comments$/.test(url.pathname)) {
    res.end(JSON.stringify({ comments }));
  } else if (url.pathname === '/api/v4/maintenances/events') {
    res.end(JSON.stringify({ events: [{ event_id: 8, maintenance_title: '网关证书更新', maintenance_description: '轮换边缘证书并检查握手兼容性。', maintenance_status: 'ACTIVE', event_status: 'SCHEDULED', event_start_date_time: now() + 2 * 86400, event_end_date_time: now() + 2 * 86400 + 3600, monitors: [{ monitor_tag: 'gateway', impact: 'MAINTENANCE' }], url: 'http://127.0.0.1:8787/maintenances/8' }] }));
  } else { res.writeHead(404); res.end('{}'); }
});
server.listen(8787, '127.0.0.1', () => console.log('Mock Kener listening on http://127.0.0.1:8787'));
