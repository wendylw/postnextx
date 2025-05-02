// src/lib/prisma.ts (建議將文件擴展名改為 .ts)
import { PrismaClient } from '@prisma/client';

// 為 TypeScript 聲明全局變數類型，避免類型檢查錯誤
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 實例化 PrismaClient
// 如果全局已有緩存 (開發環境下)，則使用緩存；否則創建新實例
const prisma: PrismaClient =
  globalThis.prisma ?? // 使用空值合併運算符 (??)
  new PrismaClient({
    // 可選配置
    // log: ['query', 'info', 'warn', 'error'],
  });

// 僅在非生產環境下緩存實例到全局
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// 導出 prisma 實例
export default prisma;
