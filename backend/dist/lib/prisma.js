"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
// src/lib/prisma.ts (建議將文件擴展名改為 .ts)
const client_1 = require("@prisma/client");
// 實例化 PrismaClient
// 如果全局已有緩存 (開發環境下)，則使用緩存；否則創建新實例
const prisma = (_a = globalThis.prisma) !== null && _a !== void 0 ? _a : new client_1.PrismaClient({
// 可選配置
// log: ['query', 'info', 'warn', 'error'],
});
// 僅在非生產環境下緩存實例到全局
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
// 導出 prisma 實例
exports.default = prisma;
//# sourceMappingURL=prisma.js.map