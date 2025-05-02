import express, { Router } from 'express';
import postsRoutes from '../posts'; // 導入用戶管理路由

const adminRouter: Router = express.Router();

adminRouter.use('/posts', postsRoutes);

export default adminRouter;
