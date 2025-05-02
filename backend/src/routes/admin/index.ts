import express, { Router } from 'express';
import { authenticateToken } from '@/middlewares/authenticateToken';
import postsRoutes from '../common/posts';
import usersRoutes from './users';
import authRoutes from './auth'; // 假設你有一個 auth 路由文件

const adminRouter: Router = express.Router();

adminRouter.use('/posts', postsRoutes);
adminRouter.use('/users', authenticateToken, usersRoutes);
adminRouter.use('/auth', authRoutes); // 添加 auth 路由

export default adminRouter;
