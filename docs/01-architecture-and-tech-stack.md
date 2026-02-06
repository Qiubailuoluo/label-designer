# 1. 项目架构与技术栈

## 1.1 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3（Composition API + `<script setup>`） |
| 语言 | TypeScript |
| 构建 | Vite 7 |
| 路由 | Vue Router 4 |
| 状态 | Pinia |
| HTTP | Axios（统一封装在 `src/api/`） |
| UI/画布 | Element Plus（部分）、Fabric.js（标签画布）、原生 CSS |
| 其他 | xlsx（Excel 解析）、dayjs、lodash-es、socket.io-client 等 |

## 1.2 目录结构概览

```
label-designer/
├── docs/                    # 说明文档
├── public/
├── src/
│   ├── api/                 # 全局 API 封装
│   │   ├── index.ts         # Axios 实例、拦截器、统一响应类型
│   │   └── auth.ts          # 登录/注册/登出接口
│   ├── components/layout/   # 布局组件（侧边栏、顶栏、主布局）
│   ├── router/              # 路由与鉴权守卫
│   ├── stores/              # Pinia 仓库（如 user）
│   ├── views/               # 页面视图
│   │   ├── login/           # 登录、注册
│   │   ├── dashboard/       # 仪表盘
│   │   ├── label-designer/  # 模板设置（列表 + 设计器）
│   │   ├── connect-print/   # 连接打印
│   │   ├── user-info/       # 用户信息
│   │   └── ...
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.*.json
```

## 1.3 前端架构要点

- **单页应用（SPA）**：Vite + Vue Router，根路径 `/` 下为主布局，子路由为各业务页。
- **鉴权**：需登录的路由设置 `meta.requiresAuth: true`，由 `router.beforeEach` 检查 `localStorage.accessToken`，无 token 则跳转 `/login`。
- **请求与 Token**：`src/api/index.ts` 中 Axios 实例通过请求拦截器自动附加 `Authorization: Bearer <token>`；响应拦截器统一处理 401/403 及 code 505（如 Token 过期）并跳转登录；响应体约定为 `{ code, msg, data }`。
- **业务模块**：登录/注册用 `api/auth.ts` + `stores/user.ts`；模板相关用 `label-designer/services/api.ts`；连接打印**复用**模板接口（getTemplateList、loadTemplate），无独立后端打印 API，ZPL 在前端生成。

## 1.4 路由一览

| 路径 | 说明 | 鉴权 |
|------|------|------|
| `/login` | 登录 | 否 |
| `/register` | 注册 | 否 |
| `/dashboard` | 仪表盘 | 是 |
| `/label-designer` | 模板列表 | 是 |
| `/label-designer/design/:id?` | 标签设计器（新建/编辑） | 是 |
| `/connect-print` | 连接打印 | 是 |
| `/user-info` | 用户信息 | 是 |

根路径 `/` 重定向到 `/dashboard`；未匹配路径重定向到 `/dashboard`。

---

下一步可阅读：  
- [02-认证与接口设计](./02-auth-api-design.md)（登录/注册/登出请求与响应）  
- [03-模板设置模块](./03-template-module-design.md)（设计器架构与模板 API）  
- [04-连接打印模块](./04-connect-print-module.md)（ZPL 生成与扩展点）
