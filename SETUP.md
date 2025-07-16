# 快速部署指南

## 🚀 本地开发环境搭建

### 1. 环境要求
- Node.js 18+
- MySQL 8.0+
- Git

### 2. 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/jhzhou002/education-system.git
cd education-system

# 2. 安装依赖
npm run install:all

# 3. 配置环境变量
cp server/.env.example server/.env
# 配置文件已预设好数据库和AI密钥，可直接使用

# 4. 创建数据库（如果尚未创建）
mysql -u root -p
CREATE DATABASE question CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# 5. 初始化数据库
npm run db:migrate
npm run db:seed

# 6. 启动服务
npm run dev
```

### 3. 访问应用
- 前端：http://localhost:5173
- 后端API：http://localhost:3000

### 4. 演示账号
| 角色 | 用户名 | 密码 |
|-----|--------|------|
| 学生 | student | admin123 |
| 教师 | teacher | admin123 |
| 管理员 | admin | admin123 |

## ⚠️ 重要配置项

### 数据库配置
编辑 `server/.env` 文件：
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=smartlearn_db
```

### AI API密钥配置（可选）
如需使用AI题目生成功能，请配置以下API密钥：
```env
DEEPSEEK_API_KEY=sk-your-deepseek-key
QWEN_API_KEY=sk-your-qwen-key
KIMI_API_KEY=sk-your-kimi-key
GEMINI_API_KEY=your-gemini-key
```

### JWT密钥
生产环境请务必修改：
```env
JWT_SECRET=your-super-secret-jwt-key
```

## 🔧 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务是否启动
   - 确认数据库用户名密码正确
   - 确认数据库存在

2. **前端无法访问后端API**
   - 检查后端服务是否在3000端口启动
   - 确认CORS配置正确

3. **依赖安装失败**
   - 尝试清除缓存：`npm cache clean --force`
   - 使用国内镜像：`npm config set registry https://registry.npmmirror.com/`

## 📦 生产环境部署

### Docker部署（推荐）
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 传统部署
```bash
# 构建前端
cd client && npm run build

# 启动生产服务
cd ../server && npm start
```

## 🔐 安全建议

1. 修改默认的JWT密钥
2. 使用强密码的数据库账户
3. 在生产环境中禁用调试模式
4. 配置HTTPS证书
5. 定期更新依赖包