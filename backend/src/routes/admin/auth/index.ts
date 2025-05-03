import express, { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../../../lib/prisma';

const router: Router = express.Router();

// 假设 JWT_SECRET 和 REFRESH_TOKEN_SECRET 在.env 中定义
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/**
 * @api {post} /admin/auth/login Login
 * @apiName Login
 * @apiGroup Auth
 * @apiDescription 用户登录接口，返回访问令牌和刷新令牌
 *
 * @apiBody {String} email 用户邮箱
 * @apiBody {String} password 用户密码
 *
 * @apiSuccess {Object} data 返回数据
 * @apiSuccess {String} data.accessToken JWT访问令牌
 * @apiSuccess {Object} data.user 用户信息
 * @apiSuccess {String} data.user.id 用户ID
 * @apiSuccess {String} data.user.email 用户邮箱
 * @apiSuccess {String} data.user.name 用户名称
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *       "user": {
 *         "id": "cl8x2y3z90000qwerty1234",
 *         "email": "user@example.com",
 *         "name": "John Doe"
 *       }
 *     }
 *
 * @apiError (401) Unauthorized 认证失败
 * @apiError (400) ValidationError 输入数据验证失败
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "message": "Invalid credentials"
 *     }
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const { email, password } = LoginSchema.parse(req.body);

    // Fetch user and associated password hash
    const user = await prisma.user.findUnique({
      where: { email },
      include: { password: true },
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password.hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
      throw new Error('JWT_SECRET or REFRESH_TOKEN_SECRET is not defined');
    }

    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    // Store refresh token hash in the database (recommended for security)
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        hashedToken: hashedRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Set refresh token in HttpOnly cookie
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return access token and user info
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
const ACCESS_TOKEN_COOKIE_NAME = 'accessToken'; // If you also store access token in cookie
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
  sameSite: 'lax' as const, // Or 'strict', MUST match the setting options
  path: '/', // Typically root path, MUST match setting options
  // domain: '.yourdomain.com', // Add if you used a domain when setting cookies
};

/**
 * @api {post} /admin/auth/logout Logout
 * @apiName Logout
 * @apiGroup Auth
 * @apiDescription 用户登出接口，使刷新令牌失效并清除认证Cookie
 *
 * @apiHeader {String} Cookie 包含refreshToken的Cookie
 *
 * @apiSuccess (204) NoContent 登出成功，无返回内容
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 204 No Content
 *
 * @apiError (500) ServerError 服务器处理登出请求时发生错误
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "message": "Logout processed, but server cleanup might have issues."
 *     }
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken: string | undefined = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  try {
    if (refreshToken && typeof refreshToken === 'string') {
      // Hash the incoming token to find the matching record in the DB
      // Use the SAME hashing algorithm (e.g., sha256) you used when storing it
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Invalidate the refresh token in the database
      // Using deleteMany for safety, though hashedToken should be unique
      await prisma.refreshToken.deleteMany({
        where: { hashedToken: hashedToken },
      });
      console.log(`Refresh token invalidated successfully.`);
    } else {
      console.log('No refresh token cookie found.');
    }
    // 清除访问 Cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, cookieOptions);
    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, cookieOptions); // Clear access token cookie too if used
    res.status(200).json({
      code: 200,
      message: '登出成功',
    });
  } catch (error) {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, cookieOptions);
    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, cookieOptions); // Clear access token cookie too if used

    next(error);
  }
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8), // 添加更复杂的规则
  name: z.string().optional(),
});

/**
 * @api {post} /admin/auth/register Register
 * @apiName Register
 * @apiGroup Auth
 * @apiDescription 新用户注册接口
 *
 * @apiBody {String} email 用户邮箱
 * @apiBody {String} password 用户密码（最少8个字符）
 * @apiBody {String} [name] 用户名称（可选）
 *
 * @apiSuccess {String} id 用户ID
 * @apiSuccess {String} email 用户邮箱
 * @apiSuccess {String} name 用户名称
 * @apiSuccess {String} createdAt 账户创建时间
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *       "id": "cl8x2y3z90000qwerty1234",
 *       "email": "user@example.com",
 *       "name": "John Doe",
 *       "createdAt": "2025-05-03T10:00:00.000Z"
 *     }
 *
 * @apiError (400) ValidationError 输入数据验证失败
 * @apiError (409) Conflict 邮箱已被注册
 *
 * @apiErrorExample {json} ValidationError-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "message": "Validation failed",
 *       "errors": [
 *         {
 *           "code": "invalid_string",
 *           "path": ["email"],
 *           "message": "Invalid email"
 *         }
 *       ]
 *     }
 *
 * @apiErrorExample {json} Conflict-Response:
 *     HTTP/1.1 409 Conflict
 *     {
 *       "message": "Email already exists"
 *     }
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. 验证输入
    const validatedData = RegisterSchema.parse(req.body);
    const { email, password, name } = validatedData;

    // 2. 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // 3. 哈希密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. 创建用户 (假设使用分离的 Password 模型)
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: {
          create: {
            hash: hashedPassword,
          },
        },
      },
      // 仅选择需要返回的字段，排除密码
      select: { id: true, email: true, name: true, createdAt: true },
    });

    // 5. 返回成功响应
    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: newUser,
    });
  } catch (error) {
    next(error); // 将其他错误传递给全局错误处理中间件
  }
});

export default router;
