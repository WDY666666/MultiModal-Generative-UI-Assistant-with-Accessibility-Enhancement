# API 说明

## 生成

- `POST /api/generate`
- 入参：`prompt`、`imageBase64`、`currentCode`、`chatHistory`
- 出参：`code`、`explanation`、`css`

## 图片分析

- `POST /api/analyze-image`
- 入参：`imageBase64`
- 出参：`description`、`layout`、`components`、`style`、`accessibilityHints`、`promptSuggestion`

## 迭代

- `POST /api/chat`
- 入参：`message`、`currentCode`、`chatHistory`、`imageDescription`
- 出参：`code`、`reply`、`css`

## 无障碍

- `POST /api/a11y/explain`
- `POST /api/fix`

## CopilotKit

- `GET /api/copilotkit/info`
- `POST /api/copilotkit`
- `POST /api/copilotkit/agent/default/run`
