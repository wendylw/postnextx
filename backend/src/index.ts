import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { Prisma } from '@prisma/client';
import postsRouter from './routes/common/posts'; // 假設你有一個 posts 路由文件
import adminRouter from './routes/admin'; // 假設你有一個 posts 路由文件

// 确保在顶部加载 dotenv
dotenv.config();

const app = express();
// 配置 CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL, // 允许的来源
  optionsSuccessStatus: 200, // 某些旧版浏览器需要 204
};

// 解析 cookie
app.use(cookieParser());
// 允许所有来源
app.use(cors(corsOptions));
// 中间件
app.use(express.json());
app.use('/api/posts', postsRouter);
app.use('/api/admin', adminRouter);

// 路由
app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.get('/healthz', (req, res) => {
  // 您可以在此处添加更复杂的检查，例如数据库连接状态
  // 但对于基本健康检查，返回 200 OK 即可
  res.status(200).send('OK');
});

// 自定义错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack); // 在服务器端记录错误
  // 检查是否是 Prisma 已知错误
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      // 记录未找到
      return res.status(404).json({ error: 'Resource not found.' });
    }
    // 可以添加更多 Prisma 特定错误代码的处理
  }
  // 其他类型的错误
  res.status(500).json({ error: 'Something went wrong!' });
});

// 启动服务器
const port = Number(process.env.PORT) || 3001; // 端口定义移到这里

app.listen(port, '::', () => {
  console.log(`Server is running locally at http://localhost:${port}`);
});

// 导出 app 以便测试
export default app;
