# 多模态生成式 UI 助手 - 带包容性增强

一个基于 CopilotKit 的 Web 应用，支持自然语言 + 图片输入生成 React + Tailwind 页面，并提供实时预览、Copilot 迭代、axe 无障碍检查和一键修复。

## 已实现

- 文本生成 UI
- 图片上传 + 结构化布局识别
- 实时预览与代码查看
- CopilotKit 工作区助手
- axe-core 无障碍扫描与修复
- 单文件 / 项目 ZIP / diff 导出
- 上一版代码恢复

## 启动

```powershell
cd frontend
npm install

cd ../backend
pip install -r requirements.txt

cd ..
py -3.11 start.py
```

## 环境变量

`backend/.env`：

```env
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1
OPENAI_MODEL=mimo-v2.5-pro
```

## 端口

- 前端：`http://localhost:5173`
- 后端：`http://localhost:8001`
- 接口文档：`http://localhost:8001/docs`

## 文档

- [架构说明](docs/architecture.md)
- [API 说明](docs/api-spec.md)
- [用户指南](docs/user-guide.md)
- [演示材料](demo/README.md)

## 说明

- 当前默认使用远程 OpenAI-compatible 模型。
- 本地 / Ollama 路径保留为后续备用方案。
