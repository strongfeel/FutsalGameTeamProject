import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 인벤토리 목록 조회 API (로그인 후 각자 인벤토리 불러 오기)
router.get("/playerInventory", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    //해당하는 유저의 인벤토리에서 playerId 가져오기
    const getPlayerId = await prisma.playerInventories.findMany({
      where: { userId: +userId },
      select: { playerId: true },
    });

    //해당하는 선수 데이터 가져오기
    const inventory = await prisma.players.findMany({
      where: { playerId: getPlayerId },
      select: {
        playerName: true,
        speed: true,
        goalDecision: true,
        goalPower: true,
        defence: true,
        stamina: true,
        overall: true,
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

// 출전 선수 명단 보기 API
router.get("/roster/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(404)
        .json({ message: "해당하는 유저가 존재하지 않습니다." });
    }

    //해당 유저의 playerId 가져오기
    const getPlayerId = await prisma.rosters.findMany({
      where: { userId: +userId },
      select: { playerId: true },
    });

    //해당하는 선수 데이터 가져오기
    const roster = await prisma.players.findMany({
      where: { playerId: getPlayerId.playerId },
      select: {
        playerName: true,
        speed: true,
        goalDecision: true,
        goalPower: true,
        defence: true,
        stamina: true,
        overall: true,
      },
      orderBy: {
        overall: "desc", // 높은 오버롤로 정렬
      },
    });

    return res.status(200).json({ data: roster });
  } catch (err) {
    console.log("출전 선수 목록 불러 오던 중 오류 발생:", err);
    next(err);
  }
});

// 인벤토리에서 출전 선수 추가 API
router.post("/roster/add/:playerId", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { playerId } = req.params;

    const inventory = await prisma.playerInventories.findFirst({
      where: { userId: +userId },
    });

    const roster = await prisma.rosters.findFirst({
      where: { userId: +userId },
    });

    // 인벤토리에서 해당 선수 유무 확인
    if (inventory.playerId !== +playerId) {
      return res
        .status(404)
        .json({ message: "해당하는 선수가 존재하지 않습니다." });
    }

    // 출전 선수 명단 3명 이상인지 확인
    const checkRosterCount = await prisma.rosters.findFirst({
      where: { userId: +userId },
      select: { rosterId: true },
    });

    let count = 0;
    for (let i = 0; i < Array(checkRosterCount).length; i++) {
      count++;
      if (count > 3) {
        return res
          .status(404)
          .json({ message: "출전 선수 명단이 이미 가득 찼습니다." });
      }
    }

    // 출전 선수 명단과 인벤토리 명단 확인
    const inventoryInPlayerId = await prisma.playerInventories.findFirst({
      where: { inventoryId: inventory.inventoryId },
      select: {
        playerId: true,
      },
    });

    const rosterInPlayerId = await prisma.rosters.findFirst({
      where: { rosterId: roster.rosterId },
      select: { playerId: true },
    });

    if (inventoryInPlayerId === rosterInPlayerId) {
      return res
        .status(404)
        .json({ message: "출전 선수 명단에 이미 존재 합니다." });
    }

    const addRosters = await prisma.$transaction(async tx => {
      await tx.rosters.create({
        data: {
          userId: inventory.userId,
          playerId: inventory.playerId,
        },
      });

      await tx.playerInventories.delete({
        where: { inventoryId: inventory.inventoryId },
      });
    });

    return res
      .status(200)
      .json(
        { message: "선수를 출전 선수 목록에 추가 하였습니다." },
        { data: addRosters }
      );
  } catch (err) {
    next(err);
  }
});

export default router;
