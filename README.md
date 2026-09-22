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
