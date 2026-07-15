# 赛车游戏 V2 —— 需求与设计文档

## 1. 概述

在 V1 基础上增加四大功能：伪 3D 透视渲染、道具系统、积分排行榜、双人对战模式。
保持单文件 `index.html`、零外部依赖的约束。

## 2. 功能需求

| ID | 需求 | 说明 |
|----|------|------|
| V2-F1 | 伪 3D 透视道路 | 灭点透视投影，道路从远处收缩到近处，车辆按深度缩放 |
| V2-F2 | 道具机制 | 三种道具从顶部掉落：加速、护盾、减速时间，偶尔出现 |
| V2-F3 | 积分排行榜 | localStorage 持久化 Top 10，游戏结束时自动保存 |
| V2-F4 | 双人对战模式 | 主菜单选择单人/双人，分屏独立进行，结算显示胜/负/平 |
| V2-F5 | 主菜单 | 游戏启动时显示，包含单人/双人/排行榜选项 |

### V1 保留功能
- 键盘控制、障碍车生成、碰撞检测、Game Over、R 重开、计分、难度递增
- 全部在单文件中完成且继续适用

## 3. 技术方案

- **渲染方式**：HTML5 Canvas（伪 3D 投影）
- **游戏循环**：`requestAnimationFrame`
- **碰撞检测**：逻辑坐标 AABB（不受透视投影影响）
- **架构核心**：`GameInstance` 类封装单局游戏逻辑，支持多实例
- **模式管理**：上层 UI 状态机（menu → playing → result）
- **数据持久化**：`localStorage`
- **文件结构**：单个 `index.html`（内嵌 CSS + JavaScript）

## 4. 3D 透视渲染

### 4.1 投影模型

```
灭点 (vanishX, vanishY) = (canvas.width/2, canvas.height * 0.3)
```

逻辑坐标空间：`normalX ∈ [0, 1]`（道路左到右），`normalY ∈ [-1, 1]`（远处到近处）

投影函数：
```
ROAD_BASE_WIDTH = canvas.width * 0.8   // 屏幕底部道路宽度

projectTo3D(normalX, normalY):
  depth = 1 / (1 + (normalY + 1) * 1.5)   // 近处 depth=1，远处 depth≈0.25
  screenX = vanishX + (normalX - 0.5) * ROAD_BASE_WIDTH * depth
  screenY = vanishY + (canvas.height - vanishY) * (normalY + 1) / 2
  scale = depth
  return { x: screenX, y: screenY, scale }
```

### 4.2 道路绘制

- 梯形路面：从灭点辐射展开到屏幕底部
- 车道线：按深度分段绘制，用梯形方式计算每段左右边界
- 路肩：道路两侧黄色边线
- 道路两侧可选深色区域表示路外地带

### 4.3 车辆绘制

- 玩家车和障碍车的逻辑坐标（normalX, normalY）通过 `projectTo3D` 转为屏幕坐标
- 车辆的宽高乘以 `scale` 实现远近缩放
- 绘制顺序：按 normalY 从小到大（远处到近处）绘制，近处覆盖远处

### 4.4 碰撞检测

碰撞检测使用原始逻辑坐标的 AABB，不依赖投影后的屏幕坐标。避免因透视缩放导致的碰撞判断误差。

## 5. GameInstance 架构

```
class GameInstance {
  constructor(canvas, controls, onGameOver)
  // canvas: 绑定的 Canvas 元素
  // controls: { left: string, right: string } 按键映射
  // onGameOver: 游戏结束回调

  reset()
  start()
  update()
  draw(ctx, width, height)    // 绘制到此实例的上下文中

  // 状态
  get score()          // number
  get isOver()         // boolean
  get result()         // { score, survived }
}
```

### 5.1 内部状态

- `player`: `{ normalX, normalY, w, h, speed, baseSpeed, shield, speedBoostTimer, slowTimer }`
- `obstacles[]`: `{ normalX, normalY, w, h, speed, color }`
- `powerups[]`: `{ normalX, normalY, type, w, h, color }`
- `score`, `frame`, `state` (playing / gameover)

### 5.2 游戏循环

```
每帧:
  if state !== 'playing' -> return
  updatePlayer(keys)
  checkCollisions()
  if state === 'gameover' -> return
  updatePowerups()
  updateObstacles()
  spawnIfNeeded()
  score++
```

### 5.3 单人/双人使用

```
// 单人
instance = new GameInstance(canvas, { left: 'a', right: 'd' }, onOver)

// 双人
instance1 = new GameInstance(canvas1, { left: 'a', right: 'd' }, onOver)
instance2 = new GameInstance(canvas2, { left: 'ArrowLeft', right: 'ArrowRight' }, onOver)
```

## 6. 道具系统

### 6.1 道具类型

| 道具 | 颜色 | 形状 | 效果 | 持续时间 |
|------|------|------|------|----------|
| 加速 | 绿色 | ◆ 菱形 | 玩家移速 ×2 | 3 秒 |
| 护盾 | 蓝色 | ● 圆形 | 抵挡一次碰撞 | 直到被击中 |
| 减速 | 紫色 | ★ 星形 | 障碍车速 ×0.5 | 3 秒 |

### 6.2 生成策略

- 生成间隔：每 300~480 帧（约 5~8 秒）尝试生成一个
- 每次随机选择一种类型
- 生成位置：在道路范围内随机 normalX，从 normalY = -1 开始下落
- 下落速度与障碍车相同

### 6.3 拾取逻辑

- 道具与玩家的矩形重叠即视为拾取
- 触发对应效果，道具从数组中移除
- 加速效果叠加：重置 3 秒计时器
- 护盾效果叠加：不叠加（已有护盾时忽略）
- 减速效果叠加：重置 3 秒计时器

### 6.4 视觉效果

- 道具逐帧闪烁或旋转（通过帧计数改变透明度/尺寸）
- 拾取时在玩家位置显示短暂粒子效果（简单圆圈扩散）
- 护盾激活时玩家周围有蓝色光环

## 7. 积分排行榜

### 7.1 数据存储

- Key: `racing_game_leaderboard`
- 格式: `[{ name: string, score: number, date: string }, ...]`
- 上限: 10 条，按分数降序排列

### 7.2 保存时机

- 单人模式 Game Over 时
- 双人模式双方都 Game Over 时
- 如果分数能进入 Top 10，弹出 `prompt()` 输入名字（默认 3 位大写字母，如 "AAA"）
- 如果已有 10 条且分数不高于最低分，不保存

### 7.3 展示

- 主菜单"排行榜"按钮打开排行榜面板
- 显示 Top 10 列表：排名、名字、分数、日期
- 底部有"清空"按钮（需确认）
- 按 ESC 或点击关闭返回主菜单

## 8. 双人对战模式

### 8.1 主菜单

```
┌──────────────────────┐
│   🏁 RACING GAME     │
│                      │
│   [单人模式]         │
│   [双人对战]         │
│   [排行榜]           │
│                      │
│   v2.0               │
└──────────────────────┘
```

- 方向键上下 + 回车选择，或鼠标点击

### 8.2 分屏布局

- 双人模式下页面分为左右两个 Canvas，各占 50% 宽度
- P1 在左，使用 WASD（A/D 控制左右）
- P2 在右，使用方向键（←/→ 控制左右）
- 各自独立游戏实例，互不影响

### 8.3 结算界面

```
┌──────────────────────┐
│    🏁 GAME OVER      │
│                      │
│   P1: 45s            │
│   P2: 32s            │
│                      │
│   🏆 PLAYER 1 WINS!  │
│                      │
│   [返回主菜单]       │
└──────────────────────┘
```

- 一方 Game Over 后其画布停止，另一方继续
- 双方都 Game Over 后显示结算
- 判定：分数高者胜，平局显示 "DRAW"

## 9. 游戏流程

```
启动
  └→ 主菜单
       ├→ [单人模式] → 游戏(1个GameInstance) → Game Over
       │                  → 排行榜保存(可选)
       │                  → 按 R 重开 或 按 ESC 回菜单
       │
       ├→ [双人对战] → 分屏游戏(2个GameInstance) → 双方Game Over
       │                  → 排行榜保存(可选)
       │                  → 结算界面 → 按任意键回菜单
       │
       └→ [排行榜] → 显示 Top 10 → ESC 回菜单
```

## 10. 边界情况

| 场景 | 处理方式 |
|------|----------|
| 窗口缩放 | Canvas resize，灭点位置重新计算 |
| 双人模式下窗口太小 | 两个 Canvas 各占 50% 宽度自适应 |
| localStorage 不可用 | 静默降级，排行榜功能不可用但不崩溃 |
| localStorage 数据损坏 | 清空并重新初始化 |
| 双方同时 Game Over | 同时触发结算，正常判定 |
| 道具与障碍同时碰撞 | 先判断道具拾取，再判断障碍碰撞 |
| prompt 被取消 | 不保存分数，正常进入结算/重开 |

## 11. 非功能性需求

- 所有代码在单个 HTML 文件中完成
- 不加载任何外部资源
- 兼容 Chrome / Firefox / Edge 最新版本
- 在普通硬件上保持 60fps
