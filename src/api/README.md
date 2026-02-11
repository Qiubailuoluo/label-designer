# API 层

统一封装与后端的 HTTP 请求、认证与错误处理。

## 文件说明

| 文件    | 说明 |
|---------|------|
| `index.ts` | 创建 axios 实例：baseURL、超时、请求头；请求拦截器自动附加 `Authorization: Bearer <accessToken>`；响应拦截器统一处理 505（Token 过期）跳转登录及网络错误。 |
| `auth.ts`  | 认证相关接口：`register`、`login`、`logout`；使用上述 axios 实例。 |

## 使用方式

- 其他模块直接 `import api from '@/api'` 或 `import { login, register } from '@/api/auth'`。
- 标签设计器模板接口在 `views/label-designer/services/api.ts` 中单独实现（使用原生 `fetch` + 统一认证头），与后端模板 API 格式对接。

## 环境

- `baseURL` 当前为 `http://localhost:8080/api`，可按部署环境调整（如通过环境变量）。
