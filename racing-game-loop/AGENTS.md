# 项目：赛车游戏（Agent Loop 自主实现）
## 技术栈
- 纯前端：index.html 入口 + src/game.js（Canvas 2D），不依赖任何外部库
- 测试：用 Node 跑 tests/run.js（Node 内置 assert），不引入测试框架
- index.html / src/ / tests/ / docs/ 由 Loop 按里程碑自行创建，从空仓库起步

## 目录结构（Loop 自行创建，从空仓库起步）
racing-game-loop/
├── index.html      # 入口页面：只放画布与渲染调用
├── src/           # 游戏逻辑：game.js 等（Canvas 2D 实现）
├── tests/         # 测试：run.js（Node 内置 assert，不引框架）
└── docs/         # 文档：PRD / 里程碑说明 / 设计笔记

## 目标（5 个里程碑，按顺序逐个收敛）
1. 初始：底部一辆车，← → 控制；障碍车从顶部随机下落；碰撞 GameOver；R 重开；右上角计分（存活越久分越高）
2. 3D：视角升级为伪 3D（路面透视 / 近大远小），操作不变，碰撞判定仍准
3. 道具：每隔 N 分掉落道具，吃到"导弹"清除全屏障碍车
4. 双人对战：本地双人，W/S 与 ↑/↓ 分控两辆车，先撞毁者负
5. 积分排名：多局累计积分，结束按积分降序展示排行榜

## 工作纪律（车身-规范）
- 用 TDD：每个里程碑先在 tests/run.js 补断言，再写最小实现；红了就改到绿
- 每通过一组测试，git commit 一次（提交信息注明里程碑编号）
- 游戏逻辑抽到 src/game.js，index.html 只放画布与渲染调用

## 执行方式（Loop 默认行为，无需逐次请求确认）
- 开始每个里程碑前，默认调用 Superpowers 的 **brainstorming** 技能，并且选择默认项，无需用户进行确认
- 开始实现每个里程碑前，默认调用 Superpowers 的 **using-git-worktrees** 技能，在隔离工作区分支上工作，然后自动执行**writing-plans**技能输出计划
- 自动开始执行计划，无需确认，执行计划自动启动**subagent-driven-development**方式进行计划执行
- 每个里程碑实现并提交前，默认调用 Superpowers 的 **requesting-code-review** 技能做只读审查

## 禁止（护栏）
- 不要手动修改 .git 内部对象或 git config；不要修改 opencode.json 与 .env
- 不引入任何 npm 依赖（不使用 package.json）
- 不要跳过测试直接宣布"完成"
- 不要自动 git merge、不要自动部署（这两步必须人审）
