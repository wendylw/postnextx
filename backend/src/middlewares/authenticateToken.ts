import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 從環境變數加載 SECRET，確保它存在
const JWT_SECRET = process.env.JWT_SECRET;

// 擴展 Express Request 類型 (如果尚未在其他地方定義)
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string }; // 或者更詳細的用戶類型, 例如 Prisma 的 User
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // 確保 JWT_SECRET 已配置
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured in environment variables.');
    return res.status(500).send('Internal Server Error: Authentication not configured.');
  }

  const authHeader = req.headers['authorization'];
  let token: string | undefined; // <--- 明確 token 類型

  // 檢查是否存在 Authorization header 且格式是否為 "Bearer <token>"
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // 分割字符串並獲取空格後的第二部分 (即 token)
    token = authHeader.split(' ')[1]; // <--- 提取數組的第二個元素 [1]
  }

  // 如果你想同時支援從 Cookie 獲取 Token (作為備選)
  // if (!token && req.cookies?.accessToken) {
  //   token = req.cookies.accessToken;
  // }

  // 如果最終沒有提取到 token
  if (!token) {
    // 401 Unauthorized: 表示需要身份驗證
    return res.status(401).send('Unauthorized: Access token is required.');
  }

  // 驗證 token
  jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
    // 建議為 decodedPayload 提供更精確的類型，至少是 object 或 JwtPayload
    // 例如: (err: jwt.VerifyErrors | null, decodedPayload: jwt.JwtPayload | string | undefined)

    if (err) {
      console.error('JWT Verification Error:', err.message);
      // 令牌無效或過期，都視為未授權
      // if (err.name === 'TokenExpiredError') {...} // 可以區分過期和其他錯誤
      return res.status(401).send('Unauthorized: Invalid or expired token.');
    }

    // 確保解碼後的 payload 是有效的物件且包含 userId
    if (typeof decodedPayload === 'object' && decodedPayload !== null && 'userId' in decodedPayload) {
      // 將解碼出的用戶信息附加到請求對象上
      // 注意：這裡的類型斷言假設 payload 至少包含 userId: string
      req.user = decodedPayload as { userId: string };
      next(); // 令牌有效，繼續處理請求
    } else {
      console.error('JWT payload is invalid or missing userId:', decodedPayload);
      return res.status(401).send('Unauthorized: Invalid token payload.');
    }
  });
};
