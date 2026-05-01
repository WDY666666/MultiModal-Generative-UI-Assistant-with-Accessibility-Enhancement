# 多模态生成式 UI 助手 —— 带包容性增强

一个面向前端原型开发和毕设演示的 Generative UI Web 应用。用户可以通过自然语言描述和可选参考图片，生成可运行的 React + TypeScript + Tailwind 页面/组件，并在浏览器中实时预览、聊天迭代、自动进行无障碍检查与修复建议生成。

## 当前完成度

- 文本描述生成 React + TypeScript + Tailwind 代码
- 图片上传与多模态描述入口
- Sandpack 实时浏览器预览与代码查看
- 右侧聊天迭代修改生成代码
- axe-core 无障碍扫描、评分、问题展示
- LLM 解释无障碍问题并生成修复代码
- 一键应用修复代码并重新预览
- CopilotKit 前端 Provider、Readable State、Frontend Actions
- FastAPI 端 CopilotKit/AG-UI 兼容 runtime 入口

## 依托的 GitHub 开源项目

本项目不是直接 fork 某一个 GitHub 项目，而是在本地项目中集成多个开源项目能力：

| 项目 | GitHub | 在本项目中的作用 |
| --- | --- | --- |
| CopilotKit | https://github.com/CopilotKit/CopilotKit | 作为 Generative UI / Agent UI 基础框架，当前已接入 React Provider、Readable State、Frontend Actions，并提供 `/api/copilotkit` runtime 入口 |
| AG-UI | CopilotKit 内部依赖 `@ag-ui/*` | 作为 agent 与前端交互的事件协议，后端通过 SSE 返回 `RUN_STARTED`、`TEXT_MESSAGE_*`、`RUN_FINISHED` 等事件 |
| Sandpack | https://github.com/codesandbox/sandpack | 浏览器内实时运行和预览生成的 React 代码 |
| axe-core | https://github.com/dequelabs/axe-core | 对预览页面执行无障碍自动化扫描 |
| FastAPI | https://github.com/fastapi/fastapi | 后端 API 服务，处理生成、图像分析、聊天迭代、修复和 CopilotKit runtime |

答辩时可以这样表述：本项目是“基于 CopilotKit/AG-UI 思想与协议扩展的垂直应用”，不是简单复制现有仓库。创新点在于把多模态输入、实时预览和无障碍闭环修复组合成面向 UI 生成的完整流程。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React 18 + TypeScript + Vite 5 + Tailwind CSS 3 |
| Generative UI/Agent | CopilotKit + AG-UI 兼容事件流 |
| 实时预览 | `@codesandbox/sandpack-react` |
| 无障碍检查 | `axe-core` |
| 状态管理 | Zustand |
| 后端 | Python + FastAPI |
| 模型接口 | OpenAI-compatible API，默认使用 token-plan-cn / mimo-v2.5-pro |

## 快速启动

### 1. 安装依赖

```bash
cd frontend
npm install

cd ../backend
pip install -r requirements.txt
```

### 2. 配置模型

复制 `backend/.env.example` 为 `backend/.env`，或直接使用环境变量。

当前项目统一使用 token-plan-cn 的 OpenAI-compatible 接口：

```env
OPENAI_API_KEY=your-token-plan-api-key
OPENAI_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1
OPENAI_MODEL=mimo-v2.5-pro
```

注意：真实 `OPENAI_API_KEY` 只放在本地 `backend/.env` 中，`.env` 已被 `.gitignore` 忽略，不要提交到 GitHub。

### 3. 启动项目

如果 `8000` 端口被占用，推荐使用 `8001`。启动脚本现在会自动检测端口，如果 `8001` 也被占用，会顺延到 `8002/8003...`，并自动同步前端代理：

```powershell
$env:BACKEND_PORT="8001"
py -3.11 start.py
```

访问地址：

- 前端：http://localhost:5173
- 后端：http://localhost:8001
- API 文档：http://localhost:8001/docs
- CopilotKit runtime info：http://localhost:8001/api/copilotkit/info

## 核心流程

1. 用户输入自然语言需求，可选上传草图或截图。
2. FastAPI 调用多模态/文本模型，构建增强 prompt。
3. 后端生成 React + TypeScript + Tailwind 代码。
4. 前端使用 Sandpack 实时预览生成 UI。
5. axe-core 扫描预览页面并输出无障碍问题。
6. LLM 解释问题并生成修复建议或修复代码。
7. 用户一键应用修复，预览和无障碍报告同步更新。
8. CopilotKit actions/readable state 暴露当前工作区状态和可执行操作。

## API 接口

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/api/generate` | POST | 文本/图片输入生成 React 代码 |
| `/api/analyze-image` | POST | 分析图片并返回布局描述 |
| `/api/chat` | POST | 根据自然语言指令迭代当前代码 |
| `/api/fix` | POST | 针对无障碍问题生成修复代码 |
| `/api/copilotkit/info` | GET | CopilotKit runtime 信息 |
| `/api/copilotkit` | POST | CopilotKit single-endpoint 兼容入口 |
| `/api/copilotkit/agent/default/run` | POST | AG-UI SSE agent run 入口 |

## 项目结构

```text
frontend/
  src/
    components/
      copilot/          # CopilotKit actions/readable state
      input-panel/      # 文本输入与图片上传
      preview-panel/    # Sandpack 预览与代码查看
      side-panel/       # 聊天迭代与无障碍报告
      layout/           # 三栏布局
    hooks/              # axe 扫描等 hooks
    services/           # 前端 API 调用
    stores/             # Zustand 状态
    lib/                # 工具函数与默认代码
    types/              # TypeScript 类型
backend/
  app/
    api/routes/         # generate/chat/fix/analyze/copilotkit 路由
    schemas/            # 请求与响应模型
    services/           # LLM、prompt、图像、修复服务
  requirements.txt
start.py                # 一键启动脚本
```

## 当前注意事项

- 当前 CopilotKit 已有真实 runtime 入口，但右侧主聊天仍使用项目自定义聊天 UI；这是为了保持生成、预览、a11y 修复闭环稳定。
- `8000` 在你的机器上曾被占用，演示时建议固定用 `BACKEND_PORT=8001`。
- Sandpack 会访问 CodeSandbox 的运行时资源；如果网络受限，预览加载可能变慢。
- 前端构建包较大主要来自 CopilotKit、Sandpack 和代码高亮依赖，MVP 演示可接受。

## 验证命令

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build

cd ..
py -3.11 -m py_compile backend\app\main.py backend\app\api\routes\copilotkit.py
```

