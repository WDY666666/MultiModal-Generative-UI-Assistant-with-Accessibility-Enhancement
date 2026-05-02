# MultiModal Generative UI Assistant with Accessibility Enhancement

多模态生成式 UI 助手（带包容性增强）。

这是一个面向原型开发和毕设演示的 Web 应用：  
用户输入自然语言（可选上传草图/截图），系统生成可运行的 `React + TypeScript + Tailwind` 页面，并支持实时预览、聊天迭代、`axe-core` 无障碍扫描和修复建议。

## 1. 当前能力

- 文本/图片输入生成前端页面代码
- Sandpack 实时预览 + 代码查看
- 右侧聊天迭代（基于当前代码继续修改）
- 自动无障碍扫描（axe-core）
- LLM 解释问题并生成修复代码
- CopilotKit 接入（Provider + readable state + frontend actions + runtime endpoint）

## 2. 依托的开源项目

- CopilotKit: <https://github.com/CopilotKit/CopilotKit>
- AG-UI (CopilotKit protocol stack)
- Sandpack: <https://github.com/codesandbox/sandpack>
- axe-core: <https://github.com/dequelabs/axe-core>
- FastAPI: <https://github.com/fastapi/fastapi>

说明：本项目不是单仓库 fork，而是在 CopilotKit/AG-UI 思路上做垂直扩展，重点是「生成式 UI + 无障碍闭环」。

## 3. 技术栈

- Frontend: `React 18 + TypeScript + Vite + Tailwind CSS`
- State: `Zustand`
- Preview: `@codesandbox/sandpack-react`
- Accessibility: `axe-core`
- Backend: `FastAPI`
- Model API: OpenAI-compatible endpoint (默认 `mimo-v2.5-pro`)

## 4. 快速启动

### 4.1 安装依赖

```bash
cd frontend
npm install

cd ../backend
pip install -r requirements.txt
```

### 4.2 配置模型

在 `backend/.env` 中配置：

```env
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1
OPENAI_MODEL=mimo-v2.5-pro
```

### 4.3 一键启动

```powershell
$env:BACKEND_PORT="8001"
py -3.11 start.py
```

启动后地址：

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:8001>
- OpenAPI docs: <http://localhost:8001/docs>
- CopilotKit runtime info: <http://localhost:8001/api/copilotkit/info>

## 5. 核心流程

1. 用户输入需求（可选上传图片）
2. 后端构建 prompt，调用模型生成 TSX
3. 前端 Sandpack 渲染并实时预览
4. 触发 axe 扫描，输出 violation
5. LLM 解释 violation 并生成修复代码
6. 应用修复并更新预览

## 6. API 概览

- `POST /api/generate`: 生成代码
- `POST /api/analyze-image`: 图片布局分析
- `POST /api/chat`: 基于当前代码迭代
- `POST /api/fix`: 针对 a11y 问题修复
- `GET /api/copilotkit/info`: runtime 信息
- `POST /api/copilotkit`: CopilotKit single-endpoint
- `POST /api/copilotkit/agent/default/run`: AG-UI SSE run

## 7. 目录结构

```text
frontend/
  src/
    components/
      input-panel/
      preview-panel/
      side-panel/
      copilot/
    hooks/
    services/
    stores/
    lib/
    types/

backend/
  app/
    api/routes/
    schemas/
    services/
```

## 8. 当前实现约束（重要）

- 右侧自定义聊天迭代是当前“直接改预览代码”的主链路。
- CopilotKit runtime 已接入，并可读取 workspace state；但自动改代码仍以项目内迭代链路为主（`/api/chat`）。
- 若上游模型未返回可预览代码，系统会保留当前可预览版本或回退到 fallback 模板。

## 9. 验证命令

```powershell
cd frontend
npm run lint
npm run build

cd ..
py -3.11 -m py_compile backend\app\main.py backend\app\api\routes\generate.py backend\app\api\routes\chat.py backend\app\api\routes\copilotkit.py
```

## 10. Demo 推荐场景

- 在线教育仪表盘
- 现代管理后台
- 登录/注册与表单流程页面

