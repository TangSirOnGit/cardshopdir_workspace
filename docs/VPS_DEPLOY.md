# CardShopDir 部署文档

> **旧文档已拆分为两个文件：**

| 文件                                 | 用途                                                             |
| ------------------------------------ | ---------------------------------------------------------------- |
| [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) | 首次部署操作指南（从零开始：数据库、Nginx、SSL、DNS、Seed 数据） |
| [deploy.sh](./deploy.sh)             | 自动部署脚本（代码 push 后在 VPS 执行一键更新）                  |

## 快速参考

### 首次部署

```bash
# 在 VPS 上，按 DEPLOY_GUIDE.md 逐步执行
# 核心步骤：克隆代码 → 安装依赖 → 配置 .env → 迁移 → Seed → Build → PM2 → Nginx → SSL
```

### 日常更新（代码 push 后）

```bash
# SSH 到 VPS
ssh root@31.220.31.224

# 一键部署
cd /var/www/cardshopdir-workspace
./deploy.sh

# 如果有数据库 schema 变化：
./deploy.sh --migrate

# 如果需要重新导入种子数据：
./deploy.sh --seed
```

### 端口分配

| 应用                | 端口     | 域名                |
| ------------------- | -------- | ------------------- |
| firsto.co           | 3001     | firsto.co           |
| aiaffiliatelist.com | 5176     | aiaffiliatelist.com |
| **cardshopdir**     | **3030** | **cardshopdir.com** |
