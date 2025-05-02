"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const posts_1 = __importDefault(require("./routes/posts")); // 假設你有一個 posts 路由文件
// 确保在顶部加载 dotenv
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3001;
// 配置 CORS
const corsOptions = {
    origin: process.env.FRONTEND_URL, // 允许的来源
    optionsSuccessStatus: 200, // 某些旧版浏览器需要 204
};
// 允许所有来源
app.use((0, cors_1.default)(corsOptions));
// 中间件
app.use(express_1.default.json());
app.use('/api/posts', posts_1.default);
// 路由
app.get('/', (req, res) => {
    res.send('Hello World!');
});
// 自定义错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack); // 在服务器端记录错误
    // 检查是否是 Prisma 已知错误
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
// 导出 app 以便测试
exports.default = app;
//# sourceMappingURL=index.js.map