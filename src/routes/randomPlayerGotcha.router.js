import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 선수 뽑기 API 구현
router.post("/playerDraw", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

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

    const getPlayerOverallMiddle = await prisma.players.findMany({
      where: {
        overall: {
          lt: 100, // 100 미만
          gte: 95, // 95 이상
        },
      },
      select: { playerId: true },
    });

    const getPlayerOverallLow = await prisma.players.findMany({
      where: {
        overall: {
          lt: 95, // 95 미만
        },
      },
      select: { playerId: true },
    });

    // 오버롤에 따라서 나눈 선수들의 파트를 선택하기 위한 부분 (1~20 / 21~50 / 51~100)
    let getOverallPart = Math.floor(Math.random() * 100) + 1;

    // 해당 오버롤 파트에서 뽑힌 선수 아이디를 저장하는 부분
    let randomPlayer = 0;
    if (getOverallPart <= 20) {
      let randomPlayerArr = Math.floor(
        Math.random() * getPlayerOverallHigh.length
      );

      randomPlayer = getPlayerOverallHigh[randomPlayerArr];
    } else if (getOverallPart > 20 && getOverallPart <= 50) {
      let randomPlayerArr = Math.floor(
        Math.random() * getPlayerOverallMiddle.length
      );

      randomPlayer = getPlayerOverallMiddle[randomPlayerArr];
    } else if (getOverallPart > 50) {
      let randomPlayerArr = Math.floor(
        Math.random() * getPlayerOverallLow.length
      );

      randomPlayer = getPlayerOverallLow[randomPlayerArr];
    }

    const playerIdArr = parseInt(Object.values(randomPlayer));

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
});

export default router;
