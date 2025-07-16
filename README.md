# 天天练 - 数学学习平台 🚀

> 简化版的数学学习平台，专注于"天天练"功能，提供AI生成的数学选择题练习

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-brightgreen.svg)](https://vuejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ 功能特性

- 🎯 **天天练**: 选择难度，AI生成12道数学选择题
- 🤖 **AI生成题目**: 基于DeepSeek模型生成高质量数学题目
- 📊 **即时反馈**: 答题后立即查看结果和详细解析
- 👤 **用户系统**: 注册、登录、会话管理
- 🏗️ **现代化架构**: Vue 3 + Node.js + MySQL 技术栈
- 📱 **响应式设计**: 支持桌面和移动设备

## 🏗️ 项目结构

```
education-system/
├── backend/                # 后端服务
│   ├── config/            # 配置文件
│   ├── database/          # 数据库脚本
│   ├── middleware/        # 中间件
│   ├── routes/           # API路由
│   └── server.js         # 主服务器文件
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   ├── utils/        # 工具函数
│   │   └── router/       # 路由配置
│   └── package.json
└── README.md
```

## 🛠️ 技术栈

### 后端
- Node.js + Express
- MySQL数据库
- JWT认证
- DeepSeek AI API
- bcryptjs密码加密

### 前端
- Vue 3 + Composition API
- Element Plus UI组件
- Vite构建工具
- Axios HTTP客户端

## 📋 核心功能

### 🎯 学习管理
- [x] 多科目学习进度追踪
- [x] 个性化知识点掌握分析
- [x] 自适应学习路径推荐
- [x] 学习统计和可视化

### 📝 题目系统
- [x] AI智能题目生成
- [x] 多种题型支持（单选、多选、填空、解答）
- [x] 难度自适应调整
- [x] 详细答题分析

### 👤 用户体系
- [x] 学生、教师、管理员角色
- [x] JWT身份认证
- [x] 权限分级管理
- [x] 个人资料管理

### 🤖 AI功能
- [x] 多模型题目生成
- [x] 题目质量评估
- [x] 个性化推荐算法
- [x] 学习数据分析

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MySQL 8.0+
- Git

### 1. 克隆项目
```bash
git clone https://github.com/your-username/education-system.git
cd education-system
```

### 2. 安装依赖
```bash
# 安装所有依赖
npm run install:all

# 或分别安装
npm install
cd server && npm install
cd ../client && npm install
```

### 3. 配置数据库
```bash
# 复制环境配置文件
cp server/.env.example server/.env

# 配置文件已预设好数据库连接和AI密钥，可直接使用
# 如需修改，请编辑 server/.env 文件
```

### 4. 初始化数据库
```bash
# 运行数据库迁移
npm run db:migrate

# 导入种子数据
npm run db:seed
```

### 5. 启动服务
```bash
# 开发模式（前后端同时启动）
npm run dev

# 或分别启动
npm run dev:server  # 后端服务：http://localhost:3000
npm run dev:client  # 前端服务：http://localhost:5173
```

### 6. 访问应用
- 前端地址：http://localhost:5173
- 后端API：http://localhost:3000/api
- 健康检查：http://localhost:3000/health

## 🗃️ 数据库设计

### 核心数据表
- `sl_users` - 用户管理
- `sl_subjects` - 科目信息
- `sl_knowledge_points` - 知识点体系
- `sl_questions` - 题目库
- `sl_user_progress` - 学习进度
- `sl_user_answers` - 答题记录

### 关系设计
```sql
用户 1:N 学习进度 N:1 知识点
用户 1:N 答题记录 N:1 题目
题目 N:M 知识点 (关联表)
知识点 N:1 章节 N:1 科目
```

## 📱 演示账号

| 角色 | 用户名 | 密码 | 说明 |
|-----|--------|------|------|
| 学生 | student | admin123 | 体验学习功能 |
| 教师 | teacher | admin123 | 体验教学管理 |
| 管理员 | admin | admin123 | 体验系统管理 |

## 🎮 使用指南

### 学生用户
1. **注册/登录** - 创建账号并完善个人信息
2. **选择科目** - 从数学、物理、化学、生物中选择学习科目
3. **知识点学习** - 按章节系统学习知识点
4. **题目练习** - 完成AI生成的个性化题目
5. **进度查看** - 监控学习进度和掌握情况

### 教师用户
1. **题目管理** - 创建、编辑、审核题目
2. **AI生成** - 使用AI工具批量生成题目
3. **学生管理** - 查看学生学习情况
4. **数据分析** - 分析教学效果

### 管理员
1. **用户管理** - 管理系统用户
2. **系统配置** - 配置系统参数
3. **数据统计** - 查看系统使用统计

## 🔧 开发指南

### 项目结构
```
education-system/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── views/         # 页面
│   │   ├── store/         # 状态管理
│   │   ├── router/        # 路由配置
│   │   └── utils/         # 工具函数
│   └── package.json
├── server/                 # 后端应用
│   ├── config/            # 配置文件
│   ├── controllers/       # 控制器
│   ├── middleware/        # 中间件
│   ├── models/           # 数据模型
│   ├── routes/           # 路由定义
│   ├── scripts/          # 脚本文件
│   └── utils/            # 工具函数
├── CLAUDE.md             # Claude AI使用指南
└── README.md            # 项目说明
```

### 开发规范
- **代码风格**：使用ESLint + Prettier
- **提交规范**：遵循Conventional Commits
- **分支策略**：Git Flow工作流
- **测试要求**：单元测试覆盖率 > 80%

### API文档
启动服务后访问：http://localhost:3000/api-docs

## 🧪 测试

```bash
# 运行所有测试
npm test

# 后端测试
cd server && npm test

# 前端测试
cd client && npm test

# 测试覆盖率
npm run test:coverage
```

## 📦 部署

### Docker部署
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 生产环境
```bash
# 构建前端
npm run build

# 启动生产服务
npm start
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 开源许可

本项目采用 [MIT](LICENSE) 许可证。

## 📞 联系我们

- 项目主页：https://github.com/your-username/education-system
- 问题反馈：https://github.com/your-username/education-system/issues
- 邮箱：smartlearn@example.com

## 🙏 致谢

感谢所有为这个项目贡献代码和想法的开发者们！

---

**智学团队** ❤️ 用技术赋能教育