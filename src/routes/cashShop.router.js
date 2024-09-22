import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 캐시 충전 API 구현
router.post("/cash", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const findUser = await prisma.users.update({
      where: { userId: +userId },
      data: {
        money: { increment: 5000 },
      },
    });

    return res
      .status(200)
      .json({ id: findUser.id, cash_charge: findUser.money });
  } catch (e) {
    next(e);
  }
});

// 유저 랭킹 조회 API 구현
router.get("/userRanking", async (req, res, next) => {
  try {
    const posts = await prisma.users.findMany({
      select: {
        id: true,
        gamePoint: true,
        gamerecords: {
          select: {
            win: true,
            lose: true,
            draw: true,
          },
        },
      },
      orderBy: {
        gamePoint: "desc",
      },
    });

    return res.status(200).json({ rankings: posts });
  } catch (e) {
    console.log("랭킹 조회에 실패했습니다.", e);
    next(e);
  }
});

export default router;
