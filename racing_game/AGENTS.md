# AGENTS.md - 代理协作指南

Express.js + TypeScript 后端应用模板，提供 REST API 与前端静态资源托管。

**技术栈**：
- **后端**：Node.js + Express.js + TypeScript
- **前端**：不限框架，构建产物放入 `public/` 由 Express 托管
- **包管理**：pnpm

## 关键技能加载（最高优先级）

开始任何工作前，必须先加载对应技能。技能提供专业上下文和最佳实践，**不加载就开始写代码属于违规操作**。

- **前后端开发均须加载**：`create-specification`、`update-specification` — 新功能实现前必须先用 `create-specification` 在 `spec/` 目录生成规格文档对齐预期，代码变更后必须用 `update-specification` 同步更新规格文档保持一致性
- **前端（核心技能）**：`ui-ux-pro-max` — ⚠️ **最重要、必须优先加载**，涉及任何前端页面、组件、样式、交互、布局工作时**首先加载此技能**，它涵盖 50+ 设计风格、161 调色板、10+ 技术栈，是前端工作的唯一核心决策源
- **前端（辅助技能）**：`frontend-design`、`responsive-design` — 加载 `ui-ux-pro-max` 后按需补充加载
- **后端**：`nodejs-backend-patterns` — 涉及 API 路由、中间件、数据库等后端工作时加载
- **项目管理（依赖/构建）**：`pnpm` — 涉及依赖安装、包管理、构建配置时加载
- **调试排错**：`systematic-debugging` — 遇到任何报错、测试失败、异常行为时立即加载，先诊断再修复

## Agent 行为约束

- **语言一致性**：MUST 使用与用户一致的语言回复（中文问中文答，英文问英文答）
- **禁止自动启动开发服务器**：未经用户明确要求，MUST NOT 执行 `pnpm dev`、`pnpm start` 等持续运行命令；若必须启动，MUST 设 timeout（120000ms）
- **引导用户预览**：用户需查看运行效果时，MUST 引导通过预览面板操作，MUST NOT 自行启动服务器
- **代码变更后验证编译**：每次修改完成后，MUST 执行 `./scripts/build.sh` 验证构建通过
- **包管理器**：MUST 使用 **pnpm**，MUST NOT 使用 npm / yarn
- **页面可达性（首页入口保障）**：必须**直接替换** `public/index.html` 为实际应用前端内容，禁止另建新页面却保留模板默认占位首页；开发完成后必须自检默认首页是否仍为"应用构建中"占位内容
- **结构/配置变更同步更新 AGENTS.md**：当项目发生以下变更时，MUST 同步更新 AGENTS.md 对应章节，确保文档与代码始终一致：新增/删除/重命名目录或文件 → 更新「项目结构」；新增/移除路由或挂载点 → 更新对应路由章节；调整 TypeScript 或构建配置 → 更新对应配置章节；变更环境变量或配置文件 → 更新「环境变量」章节；新增/移除脚本或命令 → 更新「核心命令」；新增/移除技术栈依赖 → 更新「技术栈」和「架构约束」
- **完成对客提示文案**：完成一项完整开发任务后，MUST 在最终回复中生成结构化的「完成提示文案」（开头用 emoji + 标题概括成果，分维度列出完成工作，给出使用方式命令；禁止仅回复"已完成"或"done"）
- **禁止使用中国网络不可达的外部资源**：MUST NOT 引用在中国大陆网络环境下无法稳定访问的外部资源（包括但不限于 Google Fonts、Google 公共 CDN 等被阻断的服务）；字体请使用本地文件、国内可达的 CDN（如 `cdn.bootcdn.net`）或系统字体栈
- **移动端预览滚动条处理**：应用以移动端为目标，但预览在 PC 浏览器中进行，侧边滚动条会破坏移动端布局效果。生成样式代码时 MUST 处理滚动条问题：优先使用 `scrollbar-width: none`（Firefox）或 `::-webkit-scrollbar { display: none }`（Chrome/Safari/Edge）隐藏滚动条；若滚动条不可隐藏，则将容器宽度设为 `100vw` 并用 `overflow-x: hidden` 配合最小化滚动条宽度（如 `::-webkit-scrollbar { width: 2px }`），确保预览效果接近移动端实际表现

## 架构约束（红线规则）

- **后端代码必须在 `src/` 目录**：所有 TypeScript 源码放 `src/`，编译产物输出至 `dist/`，禁止直接修改 `dist/`
- **API 路由放 `src/routes/`**：新增业务路由在此目录创建文件，并在 `src/index.ts` 中用 `app.use('/api/xxx', router)` 挂载
- **静态资源放 `public/`**：前端构建产物、静态 HTML/CSS/JS 均放此目录，Express 自动托管；禁止在 `src/` 中放静态文件
- **通过环境变量配置端口/地址**：`APP_PORT`、`APP_HOST` 优先从 `process.env` 读取，`src/index.ts` 提供合理默认值（`8000` / `0.0.0.0`）。运行时可通过系统环境变量覆盖
- **前端框架自由**：前端框架不限，构建后将产物输出至 `public/` 即可；在 `scripts/build.sh` 的注释处添加前端构建命令
- **单一入口**：生产环境所有流量（API + 前端静态资源）统一通过 `APP_PORT` 对外暴露，不另起端口
- **健康检查接口（必须保留）**：`GET /api/health` 必须始终可用，返回 `{ "status": "ok" }`，无需认证，路径不可更改；该接口用于平台探活和部署就绪检测

## 🔒 平台基础设施（禁止修改）

下列文件与代码片段属于 **tbox 平台基础设施**，承载「平台 → 业务预览」的微调（Inspector）通信链路。它们与业务功能解耦——删除/修改不会让模板 demo 出错，但会**静默破坏平台能力**，比直接报错更难发现。AI agent **必须遵守**：

| 锁定对象 | 位置 | 不得做什么 |
|---|---|---|
| inspector 中间件文件 | `src/middlewares/inspector.ts` | 不得删除文件；不得改名或移除 `installInspector` / `RUNTIME_PATH` / `injectScript` / `isReady` 导出；不得修改 `RUNTIME_PATH` 的字面值（必须 `/__vs_inspector__.js`） |
| 中间件挂载调用 | `src/index.ts` 中 `installInspector(app)` | 不得删除该行；不得改变调用顺序到 `app.use('/api', ...)` 之后 |
| 守卫脚本 | `scripts/check-inspector.sh` | 不得删除脚本；不得在 `scripts/build.sh` 中跳过调用 |

**自动校验机制**：`scripts/build.sh` 会在编译前调用 `scripts/check-inspector.sh`，对上述约束做 grep 校验，违反则**构建失败并打印恢复指引**。

**例外流程**：如确有合理需求需要禁用平台微调，**必须先停止操作并向用户确认**，由人类工程师手动调整守卫脚本，禁止 AI 自行绕过。

**判定红线（@infrastructure-locked）**：相关文件顶部均带有 `@infrastructure-locked` 注释标记，看到该标记的文件 / 代码块默认不允许修改。

## 环境变量文件管理

项目不提供 `.env` 文件。配置策略：**代码默认值 + 系统环境变量覆盖**。

核心配置在 `src/index.ts` 中提供默认值，运行时可通过系统环境变量覆盖：

```bash
# 示例：覆盖默认端口
APP_PORT=9000 ./scripts/dev.sh
```

### 环境变量

| 变量 | 默认值 | 定义位置 | 用途 |
|---|---|---|---|
| `APP_PORT` | `8000` | `src/index.ts:7` | Express 服务器端口 |
| `APP_HOST` | `0.0.0.0` | `src/index.ts:8` | Express 服务器绑定地址 |
| `APP_AI_BASE_URL` | — | 按需添加 | 大模型 API 基础地址 |
| `APP_AI_API_KEY` | — | 按需添加 | 大模型 API 密钥 |
| `APP_AI_MODEL_NAME` | — | 按需添加 | 大模型模型名称 |
| `TBOX_API_KEY` | — | 按需添加 | 百宝箱开放平台应用密钥 |

**约束规则**：

1. **H5/网页前端连接后端** — 前端通过相对路径（如 `/api/...`）访问后端接口，禁止硬编码绝对地址
2. **统一端口访问** — 前后端开发、生产环境都必须统一通过 `APP_PORT` 对外提供服务
3. **端口避让规则** — `APP_PORT` **禁止设为 3000**（避免与内部服务冲突），默认使用 `8000`
4. **大模型配置** — 模板应用如需接入大模型（LLM），建议通过 `APP_AI_BASE_URL`、`APP_AI_API_KEY`、`APP_AI_MODEL_NAME` 三个环境变量读取配置，不建议在代码中硬编码密钥
5. **百宝箱开放平台配置** — 模板应用如需接入百宝箱开放平台能力，建议通过 `TBOX_API_KEY` 环境变量读取应用密钥配置

## 核心命令

| 用途 | 命令 |
|---|---|
| 构建验证 | `./scripts/build.sh` |
| 类型检查 | `pnpm type-check` |
| 仅安装依赖 | `./scripts/prepare.sh` |
| 开发服务器（需用户明确要求） | `./scripts/dev.sh` |
| 生产启动（需用户明确要求） | `./scripts/start.sh` |

## 项目结构

```
lite-express/
├── src/
│   ├── index.ts          # Express 入口：静态托管 + API 路由挂载 + 监听端口
│   └── routes/
│       └── api.ts        # 健康检查路由：GET /api/health
├── public/               # 前端构建产物放这里（Express 自动托管）
│   └── index.html        # 占位首页（替换为实际前端）
├── dist/                 # TypeScript 编译输出（git ignored）
├── scripts/
│   ├── build.sh          # 生产构建
│   ├── dev.sh            # 开发服务器（热重载）
│   ├── prepare.sh        # 仅安装依赖
│   └── start.sh          # 生产启动
├── spec/                 # 项目规格说明文档
├── .worktrees/           # git worktree 工作副本（内容被 .gitignore 忽略）
├── package.json
├── tsconfig.json
└── AGENTS.md
```
