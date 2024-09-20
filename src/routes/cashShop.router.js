import express, { Router } from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 선수 뽑기  /playerDraw  post
router.post(
  "/playerDraw/:userId",
  /* authMiddleware,*/ async (req, res, next) => {
    try {
      const userId = req.params.userId;

      const checkCash = await prisma.users.findFirst({
        where: { userId: +userId },
      });

      if (checkCash.money < 500) {
        return res.status(400).json({ message: "소지금이 부족합니다." });
      }

      // 오버롤로 해당 데이터 나눠서 playerId 불러오기
      const getPlayerOverallHigh = await prisma.players.findMany({
        where: {
          overall: {
            gte: 100, // 100 이상
          },
        },
        select: { playerId: true },
      });
      console.log(getPlayerOverallHigh);

      const getPlayerOverallMiddle = await prisma.players.findMany({
        where: {
          overall: {
            lt: 100, // 100 미만
            gte: 95, // 95 이상
          },
        },
        select: { playerId: true },
      });
      console.log(getPlayerOverallMiddle);

      const getPlayerOverallLow = await prisma.players.findMany({
        where: {
          overall: {
            lt: 95, // 95 미만
          },
        },
        select: { playerId: true },
      });
      console.log(getPlayerOverallLow);

      let getOverallPart = Math.floor(Math.random() * 100) + 1;

      let randomPlayer = 0;
      if (getOverallPart <= 20) {
        let randomPlayerArr =
          Math.floor(Math.random() * getPlayerOverallHigh.length) + 1;
        console.log(randomPlayerArr);
        randomPlayer = getPlayerOverallHigh[randomPlayerArr];
      } else if (getOverallPart > 20 || getOverallPart <= 50) {
        let randomPlayerArr =
          Math.floor(Math.random() * getPlayerOverallMiddle.length) + 1;
        console.log(randomPlayerArr);
        randomPlayer = getPlayerOverallMiddle[randomPlayerArr];
      } else if (getOverallPart > 50) {
        let randomPlayerArr =
          Math.floor(Math.random() * getPlayerOverallLow.length) + 1;
        console.log(randomPlayerArr);
        randomPlayer = getPlayerOverallLow[randomPlayerArr];
      }
      console.log(randomPlayer);

      const playerIdArr = parseInt(Object.values(randomPlayer));
      console.log(playerIdArr);

      await prisma.$transaction(async tx => {
        await tx.users.update({
          where: { userId: +userId },
          data: {
            money: { decrement: 500 },
          },
        });

        await tx.playerInventories.create({
          data: {
            userId: +userId,
            playerId: playerIdArr,
          },
        });
      });

      return res.status(200).json({ message: "선수를 영입했습니다." });
    } catch (e) {
      next(e);
    }
  }
);

// 캐시 충전  /cash  update
router.post(
  "/cash/:userId",
  /* authMiddleware,*/ async (req, res, next) => {
    try {
      const userId = req.params.userId;

      const findUser = await prisma.users.update({
        where: { userId: +userId },
        data: {
          money: { increment: 10000 },
        },
      });

      return res
        .status(200)
        .json({ id: findUser.id, cash_charge: findUser.money });
    } catch (e) {
      next(e);
    }
  }
);

// 유저 랭킹 조회  /userRanking  get
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
