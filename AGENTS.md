<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Web + Tauri 双端开发指南

本项目同时维护 Web 端和 Tauri 桌面端。两端共享 React 组件、Tailwind 样式、类型和部分业务视图，但入口与路由机制不同，新增功能必须同时检查两端。

### 架构边界

- Web 端使用 Next.js App Router：页面位于 `app/(workspace)/`，通过 URL 路由访问。
- Tauri 端使用 Vite + React：入口是 `desktop/main.tsx`，主应用是 `desktop/app.tsx`，通过 URL hash（例如 `#/waitlist`）手动切换视图。
- 共享 UI 位于 `components/`，共享静态资源位于 `public/`。`desktop/vite.config.ts` 已将项目根目录的 `public/` 作为桌面端静态资源目录。
- Tauri 的本地数据层位于 `src-tauri/`，使用 SQLite；Web 端使用 Next API 与 Cloudflare D1。数据同步逻辑和 UI 代码同步是两件独立的事情。

### 新增页面或功能时必须同步

1. 优先将页面主体做成共享视图，例如 `components/views/example-view.tsx`，避免把完整 UI 只写在 `app/` 页面文件中。
2. Web 端新增 `app/(workspace)/<route>/page.tsx`，并确认 `proxy.ts` 的 `matcher` 包含该工作区路由。
3. Tauri 端在 `desktop/app.tsx` 中增加对应的 `pathname` 分支；否则 sidebar 虽然能导航到 hash 路由，内容会落入默认的库存页面。
4. 共享导航项添加到 `components/app-sidebar.tsx`，页面标题和描述添加到 `components/workspace-header.tsx`。
5. 需要图片或其他静态素材时放入 `public/`，不要依赖临时目录或只存在于 Next.js 的资源路径。
6. 如果功能需要本地数据，先确认是否需要同时修改 Web API、Tauri command、SQLite schema/migration 以及 Cloudflare D1 同步逻辑。

### 验证清单

- Web：运行 `npm run build`，确认目标 URL 出现在 Next 路由列表中。
- 桌面端：运行 `npm run desktop:build`，确认 Vite 能解析共享组件和 `public/` 素材。
- Rust 数据层有变更时运行 `npm run test:desktop`。
- 手动验证两端的 sidebar active 状态、页面标题、窄窗口布局、深浅色主题和新素材加载。
- 不要只验证 Web 页面；新增路由必须在 Web URL 和 Tauri hash URL 各验证一次。
