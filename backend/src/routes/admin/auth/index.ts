import express, { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../../../lib/prisma';
// 假设有用于存储刷新令牌的服务
// import { addRefreshTokenToWhitelist, generateTokens } from './auth.service';

// 假设 JWT_SECRET 和 REFRESH_TOKEN_SECRET 在.env 中定义
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const router: Router = express.Router();

/**
 * @api {post} /admin/auth/login Login
 * @apiName Login
 * @apiGroup Auth
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { password: true }, // 包含关联的 Password 记录
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password.hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // --- 认证成功，生成令牌 ---
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });

    if (!REFRESH_TOKEN_SECRET) {
      throw new Error('REFRESH_TOKEN_SECRET is not defined');
    }

    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    // TODO: 将 refreshToken (或其哈希) 存储到数据库白名单
    // await addRefreshTokenToWhitelist({ token: refreshToken, userId: user.id });

    // --- 发送令牌 ---
    // 推荐：将刷新令牌存储在 HttpOnly Cookie 中
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 生产环境设为 true
      sameSite: 'lax', // 或 'strict'
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
    });

    // 访问令牌可以通过响应体返回，或也存入 HttpOnly Cookie
    res.json({
      accessToken,
      user: {
        // 返回非敏感用户信息
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    next(error);
  }
});

export default router;
