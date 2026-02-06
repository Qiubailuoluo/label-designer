# 2. 认证设计：登录 / 注册 / 登出与接口约定

## 2.1 前端调用方式

- **封装位置**：`src/api/auth.ts`（login、register、logout）  
- **HTTP 客户端**：`src/api/index.ts` 中的 Axios 实例，`baseURL` 为 `http://localhost:8080/api`，请求自动带 `Authorization: Bearer <token>`（从 `localStorage.accessToken` 读取）。  
- **状态与持久化**：Pinia 仓库 `stores/user.ts` 负责登录/注册/登出；登录成功后将 `accessToken` 与 `userInfo` 写入 `localStorage`，登出或 Token 失效时清除（并清除 `connectPrintCache`）。

## 2.2 接口请求与响应设计

### 2.2.1 用户注册

- **请求**：`POST /api/auth/register`  
- **请求体**：
  ```json
  {
    "username": "string",
    "password": "string",
    "nickname": "string（可选）"
  }
  ```
- **响应**：统一格式 `ApiResponse`（见下），注册成功时 `data` 可为 `null`。  
- **前端**：`userStore.userRegister(username, password, nickname?)`，根据 `response.code === 200` 判断成功。

### 2.2.2 用户登录

- **请求**：`POST /api/auth/login`  
- **请求体**：
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**：统一格式，且 `data` 结构为：
  ```json
  {
    "accessToken": "string",
    "userInfo": {
      "username": "string",
      "nickname": "string"
    }
  }
  ```
- **前端**：`userStore.userLogin(username, password)`；成功时 `setUserInfo(accessToken, userInfo)` 写入 localStorage 并更新 Pinia，随后可跳转（如 dashboard）。

### 2.2.3 用户登出

- **请求**：`POST /api/auth/logout`  
- **请求头**：需携带 `Authorization: Bearer <accessToken>`（由拦截器自动添加）。  
- **响应**：统一格式即可；前端在 `userStore.userLogout()` 中**无论接口成败**都会执行 `clearUserInfo()`，清除 `accessToken`、`userInfo`、`connectPrintCache`。

## 2.3 统一响应格式（ApiResponse）

所有接口均建议采用同一结构，便于拦截器与前端统一处理：

```ts
interface ApiResponse<T = any> {
  code: number   // 200 表示成功
  msg: string    // 提示信息
  data: T | null // 业务数据，可为 null
}
```

- **成功**：`code === 200`，业务数据在 `data` 中。  
- **失败**：非 200，前端用 `response.msg` 或 `error.msg` 提示用户。  
- **Token 过期**：若后端返回 `code === 505`，`src/api/index.ts` 的响应拦截器会清除本地 token 并跳转 `/login`。

## 2.4 路由与鉴权

- **需要登录的页面**：在路由配置中设置 `meta: { requiresAuth: true }`。  
- **守卫逻辑**（`router/index.ts`）：  
  - 目标需要 `requiresAuth` 且无 `localStorage.accessToken` → 跳转 `/login`。  
  - 已登录访问 `/login` 或 `/register` → 跳转 `/dashboard`。  

因此后端只需提供符合上述请求/响应格式的 `/api/auth/register`、`/api/auth/login`、`/api/auth/logout` 三个接口；前端已按此约定实现。
