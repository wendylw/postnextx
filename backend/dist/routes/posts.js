"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../lib/prisma"));
// 創建一個 Router 實例，並添加類型註解
const router = express_1.default.Router();
// 在这里定义帖子的 CRUD 路由...
// 例如：獲取所有已發布的帖子
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield prisma_1.default.post.findMany({
            // where: { published: true },
            include: {
                author: {
                    select: { name: true, email: true }, // 包括作者信息
                },
            },
            orderBy: { createdAt: 'desc' }, // 按創建時間降序排序
        });
        res.json(posts);
    }
    catch (error) {
        next(error); // 將錯誤傳遞給 Express 的錯誤處理中間件
    }
}));
// 创建新的帖子
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // 你可以從 req.body 中獲取更多用於創建用戶的資訊，例如 name
    const { title, content, authorEmail /*, authorName */ } = req.body;
    // 基本驗證
    if (!title || !authorEmail) {
        return res.status(400).json({ error: 'Title and authorEmail are required.' });
    }
    try {
        // *** 主要修改在這裡 ***
        const newPost = yield prisma_1.default.post.create({
            data: {
                title,
                content, // 如果 req.body 中沒有 content，這裡會是 undefined，Prisma 會處理（因為 schema 中 content 是可選的）
                published: false, // 預設不發布
                author: {
                    // 關聯 author 欄位
                    connectOrCreate: {
                        // 使用 connectOrCreate 操作
                        where: {
                            email: authorEmail, // 用 email 這個唯一欄位來查找現有用戶
                        },
                        create: {
                            // 如果找不到具有該 email 的用戶，則使用這裡的數據創建新用戶
                            email: authorEmail,
                            // name: authorName // 如果你想同時設置姓名，可以從 req.body 獲取 authorName 並加到這裡
                        },
                    },
                },
            },
            // 可選：在返回結果中包含作者信息，以確認連接或創建成功
            include: {
                author: {
                    select: {
                        // 只選擇需要的作者欄位
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
        res.status(201).json(newPost); // 返回 201 Created 和新帖子數據（包含作者資訊）
    }
    catch (error) {
        console.error('Failed to create post:', error); // 打印錯誤到控制台
        // 處理潛在的 Prisma 錯誤 (例如：如果 email 格式錯誤導致創建用戶失敗)
        // if (error instanceof Prisma.PrismaClientKnownRequestError) {
        //   // 特定錯誤處理...
        // }
        next(error); // 將錯誤傳遞給 Express 的錯誤處理中間件
    }
}));
// 獲取單個帖子
router.get('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const post = yield prisma_1.default.post.findUnique({
            where: { id: parseInt(id) }, // 将 id 转换为数字
            include: { author: { select: { name: true, email: true } } },
        });
        if (post) {
            res.json(post);
        }
        else {
            res.status(404).json({ error: `Post with ID ${id} not found.` }); // 处理未找到的情况
        }
    }
    catch (error) {
        next(error);
    }
}));
// 更新帖子
router.put('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, content, published } = req.body;
    try {
        const updatedPost = yield prisma_1.default.post.update({
            where: { id: parseInt(id) },
            data: { title, content, published },
        });
        res.json(updatedPost);
    }
    catch (error) {
        // 处理 Prisma 错误，例如 P2025 (记录未找到)
        // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        //   return res.status(404).json({ error: `Post with ID ${id} not found.` });
        // }
        next(error);
    }
}));
// 刪除帖子
router.delete('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deletedPost = yield prisma_1.default.post.delete({
            where: { id: parseInt(id) },
        });
        res.json(deletedPost);
    }
    catch (error) {
        // 处理 Prisma 错误，例如 P2025 (记录未找到)
        // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        //   return res.status(404).json({ error: `Post with ID ${id} not found.` });
        // }
        next(error);
    }
}));
// 使用 ES Modules 導出 router 實例
exports.default = router;
//# sourceMappingURL=posts.js.map