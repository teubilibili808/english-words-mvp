# English Words MVP

## 1. 项目定位
这是一个 **Web 英语词汇学习工具 MVP**。
项目支持用户登录、个人词库和个人复习记录，采用渐进式开发，优先保证可运行与可迭代。

## 2. 项目目标
- 提供个人英语词汇学习工具
- 用户拥有独立词库
- 基于间隔复习算法的复习系统
- 采用 Web 前端 + 后端 API + 数据库存储架构（逐步落地）

## 3. 当前功能
- 单词录入 / 编辑
- Words 页面搜索与过滤
- Review 复习系统（含 session）
- Today 页面统计
- overflowQueue 积压追赶机制
- 难词标记系统
- Review History 历史记录

## 4. 即将实现
- 用户登录系统
- 用户级数据隔离
- 后端 API
- 数据库存储
- Web 部署

## 5. 数据结构概念（抽象）
- `User`
- `Words`
- `ReviewSession`
- `ReviewHistory`

> 说明：进入 Web 多用户阶段后，所有学习数据都应归属于具体用户。

## 6. Web 架构概念（抽象）
- `Frontend (React)`
- `Backend API`
- `Database`

> 说明：当前项目仍按 MVP 路径推进，不在本阶段强制固定具体后端技术实现。

## 7. 复习算法说明
当前使用 **Review Algorithm v1**。
- 保持现有算法核心逻辑不变
- 保持现有前端页面结构不变
- 在此基础上逐步接入登录、API、数据库

## 8. 如何运行项目
### 前端
```bash
npm run start
npm run web
```

### 前端 API 环境变量
- `.env` 是项目根目录下的前端环境变量文件
- 前端默认从 `EXPO_PUBLIC_API_BASE` 读取后端地址
- 本地开发可在项目根目录 `.env` 中配置：

```bash
EXPO_PUBLIC_API_BASE=http://localhost:3001/api
```

- 如果未配置该环境变量，前端会默认使用 `http://localhost:3001/api`
- 当前线上 API 地址已经切换为：

```bash
EXPO_PUBLIC_API_BASE=https://api.5353561.xyz/api
```

- 修改环境变量后需要重启前端
- 将来如果 API 域名再次变化，只需要修改环境变量，不需要改业务源码
- 未来部署到 VPS 或域名时，只需要修改环境变量，不再建议手动改源码里的 `localhost`

### 后端
```bash
cd backend
npm install
npm start
```
