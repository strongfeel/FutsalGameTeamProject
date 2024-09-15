import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 인벤토리 목록 조회(로그인 후 각자 인벤토리 불러 옴)
router.get("/playerInventory", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  try {
    const inventory = await prisma.playerInventories.findFirst({
      where: { userId: +userId }, // 로그인 된 userId 정보
      select: {
        playerId: {
          select: {
            playerName: true,
            speed: true,
            goalDecision: true,
            goalPower: true,
            defence: true,
            stamina: true,
            overall: true,
          },
        },
      },
      orderBy: {
        overall: "desc", // 높은 오버롤로 정렬
      },
    });

    return res.status(200).json({ data: inventory });
  } catch (err) {
    console.log("인벤토리 불러 오던 중 오류 발생:", err);
    next(err);
  }
});

// 출전 선수 명단 보기
router.get("/roster/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const roster = await prisma.rosters.findFirst({
      where: {
        inventoryId: {
          select: {
            userId: +userId,
          },
        },
      },
      select: {
        inventoryId: {
          select: {
            playerId: {
              select: {
                playerName: true,
                speed: true,
                goalDecision: true,
                goalPower: true,
                defence: true,
                stamina: true,
                overall: true,
              },
            },
          },
        },
      },
      orderBy: {
        overall: "desc", // 높은 오버롤로 정렬
      },
    });

    return res.status(200).json({ data: roster });
  } catch (err) {
    next(err);
  }
});

export default router;
