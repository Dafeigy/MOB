# 部署到 Vercel

本项目是标准 Next.js 16 应用，Vercel 会自动识别 App Router、Route Handlers 和 `proxy.ts`。仓库中的 `vercel.json` 只固定框架预设；构建命令、输出目录和函数运行时继续使用 Vercel 的 Next.js 默认值。

## 1. 部署前准备 Cloudflare D1

1. 在 Cloudflare Dashboard 创建 D1 数据库。
2. 在项目根目录初始化数据库表：

   ```bash
   npx wrangler d1 execute <DATABASE_NAME> --remote --file=./scripts/d1-schema.sql
   ```

3. 如果数据库使用过旧版表结构，再执行迁移：

   ```bash
   npx wrangler d1 execute <DATABASE_NAME> --remote --file=./scripts/d1-migration-002-component-fields.sql
   ```

4. 创建 Cloudflare API Token，并授予目标账户的 `D1 Edit`（API 文档中对应 `D1 Write`）权限。建议把资源范围限制到实际使用的账户。

需要保存以下值：

- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 账户 ID。
- `CLOUDFLARE_D1_DATABASE_ID`：D1 数据库 UUID，不是数据库名称。
- `CLOUDFLARE_D1_API_TOKEN`：上一步创建的 Token。

## 2. 在 Vercel 导入项目

推荐使用 Git 自动部署：

1. 将仓库推送到 GitHub、GitLab 或 Bitbucket。
2. 登录 Vercel，选择 **Add New → Project**，导入该仓库。
3. 保持以下设置：
   - Framework Preset：`Next.js`
   - Root Directory：仓库根目录
   - Install Command：自动（会根据 `package-lock.json` 使用 npm）
   - Build Command：自动（`npm run build`）
   - Output Directory：自动，不要填写 `out`
   - Node.js：由 `package.json` 固定为 `22.x`
4. 在 **Environment Variables** 中加入下一节的五个变量。
5. 点击 **Deploy**。

连接 Git 后，生产分支（通常是 `main`）的推送会生成 Production Deployment，其他分支和 Pull Request 会生成 Preview Deployment。

## 3. 配置环境变量

在 Vercel 项目中打开 **Settings → Environment Variables**，添加：

| 变量 | 必需 | 用途 | 建议范围 |
| --- | --- | --- | --- |
| `APP_PIN` | 是 | 单用户登录密码，必须恰好为 6 位数字 | Production、Preview |
| `SESSION_SECRET` | 是 | HMAC 签名会话 Cookie 的随机密钥 | Production、Preview，且两者使用不同值 |
| `CLOUDFLARE_ACCOUNT_ID` | 数据写入时必需 | Cloudflare 账户 ID | Production、Preview |
| `CLOUDFLARE_D1_DATABASE_ID` | 数据写入时必需 | D1 数据库 UUID | Production、Preview；建议 Preview 使用独立数据库 |
| `CLOUDFLARE_D1_API_TOKEN` | 数据写入时必需 | 调用 D1 HTTP API，需写权限 | Production、Preview；建议使用独立 Token |

这些变量全部是服务端变量，不要添加 `NEXT_PUBLIC_` 前缀，也不要把真实值写进 `vercel.json` 或提交到 Git。

生成 `SESSION_SECRET`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

若只配置 `APP_PIN` 和 `SESSION_SECRET` 而不配置三项 D1 变量，网站可以登录和查看只读演示数据，但新增元件、编辑元件和出入库写入会被禁用。

环境变量变更只对新部署生效。修改后需要在 Vercel 的 **Deployments** 页面重新部署，或推送一次新提交。

## 4. 使用 Vercel CLI（可选）

也可以从项目根目录部署：

```bash
npx vercel link
npx vercel env add APP_PIN production
npx vercel env add SESSION_SECRET production
npx vercel env add CLOUDFLARE_ACCOUNT_ID production
npx vercel env add CLOUDFLARE_D1_DATABASE_ID production
npx vercel env add CLOUDFLARE_D1_API_TOKEN production
npx vercel deploy
npx vercel deploy --prod
```

第一次 `npx vercel deploy` 会创建 Preview Deployment；确认登录、库存读取和写入正常后，再运行 `npx vercel deploy --prod`。

如需把 Vercel 的 Development 环境变量同步到本地：

```bash
npx vercel env pull .env.local
```

## 5. 上线检查

部署完成后依次确认：

1. `/login` 能使用 `APP_PIN` 登录。
2. 登录后刷新 `/dashboard` 不会退出，说明 `SESSION_SECRET` 生效。
3. 元件列表能从 D1 加载。
4. 新增一个测试元件并记录一次入库，确认 Token 具有写权限。
5. 检查 Vercel **Logs**，确保没有 `D1_NOT_CONFIGURED`、401 或 403 错误。

如果绑定自定义域名，Cookie 已在生产环境启用 `Secure`，无需额外配置站点 URL 或回调 URL。
