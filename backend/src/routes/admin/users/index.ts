import express, { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../../lib/prisma';

const router: Router = express.Router();

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const users = await prisma.user.findUnique({ where: { id } });

    if (!users) {
      return res.status(404).json({ error: `User with ID ${id} not found.` });
    }

    res.json(users);
  } catch (error) {
    next(error); // 將錯誤傳遞給 Express 的錯誤處理中間件
  }
});

export default router;
