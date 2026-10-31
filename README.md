# Kener Status Web

基于 **Svelte 5、SvelteKit 和 EdgeOne Makers** 的深色单页服务状态站。页面通过服务端只读代理访问独立部署的 Kener，集中展示服务健康状态、30 天可用率、事故、维护公告和事件日历。

Kener 继续负责监控采集、调度、Redis 和持久化存储。本项目不修改 Kener，也不承担监控任务。

## 功能

- 整体状态与最近更新时间，每 60 秒自动刷新。
- 按 Kener Page 顺序展示启用且非隐藏的监控项。
- 30 天每日状态、可用率和平均响应延迟。
- 当前事故、维护计划和评论时间线。
- 历史维护公告与可交互事件日历。
- 边缘缓存、最后成功快照和浏览器 `localStorage` 缓存。
- 桌面与移动端深色布局、键盘操作、减少动态效果和 404 页面。
- 品牌名称、Logo、favicon、分享图、SEO 和备案信息配置。

## 技术架构

```text
浏览器
  │ 仅请求同源 /api/*
  ▼
EdgeOne Makers
  ├─ Svelte 静态页面
  └─ Edge Functions 只读代理
       ├─ 鉴权与字段裁剪
       ├─ 状态聚合
       ├─ 缓存与故障降级
       └─ Kener API Key 仅保存在服务端
                         │ HTTPS
                         ▼
               独立 Kener 服务
               ├─ /api/v4
               └─ /dashboard-apis
```

浏览器不会直接接触 Kener API Key，也不会接收完整监控配置或分钟级历史原始数据。

## 项目结构

```text
status-web/
├── src/
│   ├── routes/                  # 单页、布局和 404
│   ├── lib/
│   │   ├── components/          # 服务、历史、日历、导航和页脚
│   │   ├── actions/             # 滚动 reveal
│   │   ├── api.ts               # 浏览器请求与持久缓存
│   │   ├── config.ts            # Vite 公开环境变量
│   │   └── types.ts             # 公开展示模型
│   └── app.css
├── edge-functions/
│   ├── api/
│   │   ├── status.js            # GET /api/status
│   │   ├── incidents/[id].js    # GET /api/incidents/{id}
│   │   └── monitors/[tag]/history.js
│   └── lib/                     # 上游请求、缓存、状态计算和测试
├── scripts/mock-kener.mjs       # 本地模拟上游，不用于生产
├── static/                      # favicon 和分享图
├── edgeone.json                 # Makers 构建与安全响应头
├── package.json
└── .env.example
```

## 环境要求

- Node.js 22.11 或与 Makers 一致的兼容版本。
- 独立运行且可通过公网 HTTPS 访问的 Kener。
- 在 Kener `/manage` 的 API Keys 页面创建的专用密钥。
- 部署时使用 EdgeOne Makers。

Windows 本地安装依赖时，由于项目为 Linux 构建机显式声明了 Rolldown 原生绑定，npm 的平台校验可能需要：

```powershell
npm install --force
```

其他环境可使用：

```bash
npm ci
```

## 本地开发

### 1. 配置环境变量

复制 `.env.example` 中的变量到本地 `.env`，不要提交 `.env`。

```text
KENER_BASE_URL=https://kener.example.com
KENER_API_KEY=replace_with_a_dedicated_server_side_key
KENER_PAGE_PATH=~home
STATUS_TIMEZONE=Asia/Shanghai
```

`KENER_BASE_URL` 只填写 Kener 源站地址，不要附加 `/api/v4`。

### 2. 启动模拟 Kener（可选）

没有本地 Kener 时，可以使用明确隔离的模拟数据：

```bash
npm run mock:kener
```

模拟上游监听 `http://127.0.0.1:8787`。

### 3. 启动页面与本地函数

Bash：

```bash
KENER_BASE_URL=http://127.0.0.1:8787 \
KENER_API_KEY=local-development-key \
STATUS_TIMEZONE=Asia/Shanghai \
npm run dev
```

PowerShell：

```powershell
$env:KENER_BASE_URL="http://127.0.0.1:8787"
$env:KENER_API_KEY="local-development-key"
$env:STATUS_TIMEZONE="Asia/Shanghai"
npm run dev
```

默认地址为 `http://localhost:5173`。

## 环境变量

### 服务端变量

| 变量 | 必需 | 默认值 | 说明 |
|---|---|---|---|
| `KENER_BASE_URL` | 是 | 无 | Kener 公网 HTTPS 地址 |
| `KENER_API_KEY` | 是 | 无 | 仅保存在 Makers 服务端的专用密钥 |
| `KENER_PAGE_PATH` | 否 | `~home` | 要展示的 Kener Page |
| `STATUS_TIMEZONE` | 否 | `Asia/Shanghai` | 历史聚合和页面显示时区 |

### 公开品牌变量

这些变量通过 Vite 注入公开前端，只能存放非敏感信息。

| 变量 | 用途 | 未配置时 |
|---|---|---|
| `PUBLIC_BRAND_NAME` | 导航品牌名称 | Kener `page_header` |
| `PUBLIC_BRAND_LOGO` | 导航 Logo 地址 | Kener Logo 或默认图标 |
| `PUBLIC_PAGE_TITLE` | 浏览器及分享标题 | Kener `page_title` |
| `PUBLIC_META_DESCRIPTION` | 搜索与分享描述 | 默认描述 |
| `PUBLIC_FAVICON_URL` | favicon | `/favicon.svg` |
| `PUBLIC_OG_IMAGE_URL` | 社交分享图 | `/og-status.png` |
| `PUBLIC_COPYRIGHT` | 页脚版权文字 | 不显示 |
| `PUBLIC_HOME_URL` | 返回官网链接 | 隐藏 |
| `PUBLIC_PRIVACY_URL` | 隐私政策链接 | 隐藏 |
| `PUBLIC_TERMS_URL` | 服务条款链接 | 隐藏 |
| `PUBLIC_SUBSCRIBE_URL` | RSS 或订阅入口 | 隐藏 |
| `PUBLIC_STATUS_URL` | 正式状态页地址及 canonical | 不输出 canonical |

品牌资源建议使用完整 HTTPS 地址。修改公开变量后需要重新构建部署。

## API

### `GET /api/status`

聚合页面信息、当前监控状态、事故和维护。只返回公开字段。

### `GET /api/monitors/{tag}/history?days=30`

校验 tag 是否属于当前 Page，并通过 Kener 的 `monitor-bars` 聚合接口返回每日一条数据。`days` 支持 1 至 30。

### `GET /api/incidents/{id}`

返回事故公开详情和按时间倒序排列的评论，评论按纯文本渲染。

## 缓存策略

| 数据 | Makers / 浏览器缓存 | 故障降级 |
|---|---|---|
| 当前状态 | 45 秒 | 返回最后成功快照并标记 `stale` |
| 30 天历史 | 1 小时 | 使用缓存历史并标记 `stale` |
| 事故详情 | 5 分钟 | 使用缓存详情并标记 `stale` |
| 最后成功快照 | 最长 24 小时至 7 天，按接口区分 | 不会伪装成实时数据 |

浏览器还会在下次打开页面时先展示上次成功数据，再联网更新。后台标签页暂停轮询，重新可见时立即刷新。

## 检查与构建

```bash
npm run check
npm test
npm run build
```

使用 Makers 相同的 Node 版本验证：

```bash
npx -y node@22.11.0 node_modules/vite/bin/vite.js build
```

依赖安全检查：

```bash
npm audit --registry=https://registry.npmjs.org
```

## EdgeOne Makers 部署

1. 将仓库导入 Makers，使用 `main` 分支和仓库根目录。
2. 保留 `edgeone.json` 中的配置：
   - 安装命令：`npm ci`
   - 构建命令：`npm run build`
   - 输出目录：`./build`
   - Node：`22.11.0`
3. 配置服务端和公开环境变量。
4. 部署并检查：
   - `/api/status` 返回 200 和真实 Kener 数据。
   - `/api/monitors/{tag}/history?days=30` 返回 30 条以内按天数据。
   - 页面源代码和响应中不包含 `KENER_API_KEY`。
5. 绑定正式域名并配置 HTTPS，然后将 `PUBLIC_STATUS_URL` 设置为该域名并重新部署。

本地 Makers 调试可使用：

```bash
npm run makers:dev
```

该命令需要 EdgeOne CLI 登录态或 `EDGEONE_PAGES_API_TOKEN`。

## 常见问题

### `UPSTREAM_CONNECTION`

Makers 无法连接 Kener。检查公网 HTTPS、DNS、CDN/WAF 和源站网络可达性，不要先判断为业务服务宕机。

### `UPSTREAM_UNAUTHORIZED`

检查 Kener API Key 是否有效。更换 `KENER_SECRET_KEY` 后，需要重新创建 API Key。

### `UPSTREAM_INVALID_RESPONSE`

某个上游接口没有返回完整 JSON。错误中的 `endpoint` 会指出具体路径，且不包含密钥或查询参数。

### `Error return from script`

通常是 Edge Function 超出 CPU 或运行限制。当前历史数据使用 Kener 原生按天聚合，不应回源大量分钟级记录。

### `Cannot find native binding`

Linux 构建机缺少 Rolldown 原生绑定。项目已显式声明 `@rolldown/binding-linux-x64-gnu`，请确认安装的是包含该提交的依赖锁文件，并重新执行干净构建。

## 安全说明

- 不要把 `KENER_API_KEY` 放入 `PUBLIC_*`、Git、HTML、日志或浏览器请求。
- 定期轮换 Kener API Key。
- 测试和生产环境使用不同的 Makers 项目与密钥。
- 外部链接使用 `noopener noreferrer`，评论和描述不注入 HTML。
- 代理只开放固定 GET 路由，不支持任意 URL 或 Kener 路径转发。
