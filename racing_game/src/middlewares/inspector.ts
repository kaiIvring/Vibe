import type { Express, Request, Response, NextFunction } from 'express';

/**
 * ============================================================================
 * 🔒 平台基础设施 — 禁止 AI 修改或删除（@infrastructure-locked）
 * ============================================================================
 * tbox 平台微调（Inspector）能力注入。
 *
 * 工作方式：
 * 1. 启动时从公网拉取 inspector runtime 缓存到内存
 * 2. 暴露 GET {RUNTIME_PATH} 返回缓存内容
 * 3. 全局拦截 text/html 响应，在 </head> 前插入 <script src> 一行
 *
 * ⚠️ 这是平台契约的一部分，AI agent 不得：
 *   - 删除本文件
 *   - 修改导出的 `installInspector` / `RUNTIME_PATH` / `injectScript` / `isReady`
 *   - 改动 `RUNTIME_PATH` 路径（值必须为 `/__vs_inspector__.js`，前端 host 依赖此约定）
 *   - 移除 `src/index.ts` 中的 `installInspector(app)` 调用
 *
 * 校验：`scripts/check-inspector.sh` 会在每次构建时检查上述约束，违反则构建失败。
 * 业务层（路由 / 静态资源）完全不依赖本中间件，可放心独立修改。
 * ============================================================================
 */

const INSPECTOR_URL =
  'https://env-00jx4e7pq1un-static.normal.cloudstatic.cn/asset/codingbox/inspector.umd.js';
const RUNTIME_PATH = '/__vs_inspector__.js';
const SCRIPT_TAG = `<script src="${RUNTIME_PATH}" defer></script>`;

let runtimeJs = '';
let fetched = false;

async function fetchRuntime(retry = 3): Promise<void> {
  for (let i = 0; i < retry; i++) {
    try {
      const r = await fetch(INSPECTOR_URL);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      runtimeJs = await r.text();
      fetched = true;
      console.log(`[inspector] runtime loaded (${runtimeJs.length} bytes)`);
      return;
    } catch (e) {
      console.warn(`[inspector] fetch failed (attempt ${i + 1}/${retry}):`, (e as Error).message);
      if (i < retry - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  console.error('[inspector] runtime unavailable; inspector script will be skipped');
}

function injectScript(html: string): string {
  // 优先 </head>，否则尝试 <body 之前；都没有就放弃
  const headIdx = html.search(/<\/head\s*>/i);
  if (headIdx !== -1) return html.slice(0, headIdx) + SCRIPT_TAG + html.slice(headIdx);
  const bodyIdx = html.search(/<body[\s>]/i);
  if (bodyIdx !== -1) return html.slice(0, bodyIdx) + SCRIPT_TAG + html.slice(bodyIdx);
  return html;
}

export function installInspector(app: Express): void {
  // 异步预热，不阻塞启动
  void fetchRuntime();

  // 1) runtime 路由
  app.get(RUNTIME_PATH, (_req: Request, res: Response) => {
    if (!runtimeJs) {
      res.status(503).type('application/javascript').send('// inspector runtime not ready');
      return;
    }
    res.type('application/javascript').set('Cache-Control', 'no-cache').send(runtimeJs);
  });

  // 2) HTML 注入 middleware（放在所有路由前）
  app.use((_req: Request, res: Response, next: NextFunction) => {
    if (!fetched) return next();

    const chunks: Buffer[] = [];
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);
    let hijack = false;

    // 在写第一个 chunk 前判断 content-type
    const shouldHijack = () => {
      const ct = String(res.getHeader('content-type') || '');
      const ce = String(res.getHeader('content-encoding') || '');
      return ct.includes('text/html') && !ce; // 不处理压缩响应
    };

    res.write = ((chunk: any, ...args: any[]) => {
      if (!hijack && !chunks.length) hijack = shouldHijack();
      if (hijack && chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      }
      return origWrite(chunk, ...args);
    }) as typeof res.write;

    res.end = ((chunk?: any, ...args: any[]) => {
      if (!hijack && !chunks.length) hijack = shouldHijack();
      if (hijack) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        try {
          const html = Buffer.concat(chunks).toString('utf8');
          const injected = injectScript(html);
          res.setHeader('Content-Length', Buffer.byteLength(injected));
          return origEnd(injected, ...args);
        } catch (e) {
          console.warn('[inspector] inject failed, fallback to original:', (e as Error).message);
          return origEnd(Buffer.concat(chunks), ...args);
        }
      }
      return origEnd(chunk, ...args);
    }) as typeof res.end;

    next();
  });
}
