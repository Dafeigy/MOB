# Retos

Retos 是一个面向个人工作台的 PCB 焊接元件库存管理系统，使用 Next.js 16、React 19、shadcn/ui、RareUI OTP Input 和 Cloudflare D1 构建。

## 已实现

- 6 位数字密码登录，密码从服务端 `APP_PIN` 读取
- HMAC 签名的 HttpOnly 会话 Cookie 与受保护路由
- 可折叠、移动端友好的 shadcn Sidebar 工作台
- 库存总览、元件搜索、新增元件、出入库流水、低库存提醒
- Cloudflare D1 HTTP API 数据层
- D1 未配置时自动使用只读演示数据

## 本地运行

复制环境变量模板并调整配置：

```bash
copy .env.example .env.local
```

默认本地数字密码为 `123456`。生产环境务必更换 `APP_PIN` 和 `SESSION_SECRET`。

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## Cloudflare D1

1. 在 Cloudflare 创建 D1 数据库。
2. 初始化表结构：

```bash
npx wrangler d1 execute <DATABASE_NAME> --remote --file=./scripts/d1-schema.sql
```

已使用过旧版表结构的数据库，改版后请额外执行一次迁移脚本（它会将原制造商字段保留为备注说明，并移除料号字段）：

```bash
npx wrangler d1 execute <DATABASE_NAME> --remote --file=./scripts/d1-migration-002-component-fields.sql
```

3. 将以下值写入 `.env.local` 或部署平台的服务器环境变量：

```dotenv
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_D1_DATABASE_ID=
CLOUDFLARE_D1_API_TOKEN=
```

API Token 需要账户级 `D1 Edit` 权限（仅有读取权限无法新增元件或执行迁移）。这些变量没有 `NEXT_PUBLIC_` 前缀，因此不会被打包到客户端。

## 验证

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Vercel 部署

项目已包含 `vercel.json` 和 `.vercelignore`。完整的 Vercel 导入步骤、Cloudflare D1 准备、环境变量配置和上线检查请见 [`DEPLOYMENT.md`](./DEPLOYMENT.md)。

数据库表结构位于 [`scripts/d1-schema.sql`](./scripts/d1-schema.sql)，环境变量示例位于 [`.env.example`](./.env.example)。

## Windows 桌面端

桌面使用 Tauri 2、React/Vite 和本地 SQLite，复用 Web 的页面、表单和样式。离线启动及增删改、出入库不需要 D1 或 Web 登录。

开发环境需要 Node.js 22、Rust、Visual Studio C++ Build Tools 和 WebView2：

```bash
npm install
npm run desktop
```

生成 Windows NSIS 安装包：

```bash
npm run desktop:package
```

安装包输出至 `src-tauri/target/release/bundle/nsis/`。本地数据库保存在 `%APPDATA%/com.retos.inventory/inventory.sqlite3`，不放在安装目录，重新安装不会覆盖库存。备份时先退出应用，再复制该文件。

### 云端配置与同步

1. 打开桌面端「系统设置 → 云端同步」，可手工填写或粘贴 `.env.local` 内容。
2. 只导入 `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_D1_DATABASE_ID`、`CLOUDFLARE_D1_API_TOKEN`。Token 在 Windows 上通过当前用户的 DPAPI 加密存入本地数据库，不进入前端持久化存储或安装包。
3. 已有云端库存时，在「元件库存」点击「拉取更新」初始化本地库存。
4. 日常操作完成后点击「推送到云端」。桌面无自动网络同步。

同步规则：

- 推送上传本地待同步元件及流水，以 UUID 去重。元件按更新时间比较，较新记录胜出，时间相同由本次桌面推送胜出。若云端版本更新，推送完成后本地接收该云端版本。
- 拉取分页读取云端记录，只更新没有待推送修改的本地元件；本地未推送的新增、编辑和删除始终保留。旧云端数据不会覆盖更新的本地版本。
- 删除采用 `deleted_at` 标记；关联流水保留但在两端页面隐藏，防止同步后重新出现。
- 流水为不可变记录，重复同步不会重复入库/出库。数量以元件记录为准，不把两端独立操作相加。
- 同步失败保留待同步状态，重试按 UUID 和版本去重；同步期间的新修改不会被旧请求清除。
- 更换 Account ID / Database ID 会将本地记录重新标记为待推送。Token 留空保持原值，更换数据库时必须提供 Token。
- 首次同步自动初始化空 D1，或为已有 `components` 表补充 `deleted_at`。Web 数据层也会检查该字段。更早的 `manufacturer` 表结构需要先执行原有 `002` 迁移。
- 已有 Web 部署需要更新本次代码，以正确隐藏删除标记并产生毫秒级时间。手动迁移脚本 `scripts/d1-migration-003-local-sync.sql` 仅适用于尚无 `deleted_at` 的数据库。

### 验证

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run desktop:build
npm run test:desktop
```

本地数据库测试覆盖库存事务、删除传播、时间比较、同步幂等、失败回滚、同步期间编辑和凭据加密。独立 UI 验证构建可使用 `node node_modules/@tauri-apps/cli/tauri.js build --debug --no-bundle --config desktop/tauri.smoke.json`，数据与正式应用隔离。
