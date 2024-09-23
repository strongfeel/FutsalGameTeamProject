import express from "express";
import { prisma } from "../utils/prisma/index.js";
import { Prisma } from "@prisma/client";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 내 인벤토리 목록 조회 API (로그인 후 각자 인벤토리 불러 오기)
router.get("/playerInventory", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    // 해당하는 유저의 인벤토리에서 playerId 가져오기
    const getPlayerId = await prisma.playerInventories.findMany({
      where: { userId: +userId },
      select: { playerId: true },
    });

    // getPlayerId 값을 빈배열로 빼오는 작업
    const playerIdArr = [];

    for (let playerId of getPlayerId) {
      playerIdArr.push(playerId.playerId);
    }

    // 해당하는 선수 데이터 가져오기
    let inventoryArr = [];
    for (let i = 0; i < playerIdArr.length; i++) {
      const inventory = await prisma.players.findMany({
        where: { playerId: +playerIdArr[i] },
        select: {
          playerId: true,
          playerName: true,
          speed: true,
          goalDecision: true,
          goalPower: true,
          defence: true,
          stamina: true,
          overall: true,
        },
      });
      inventoryArr.push(inventory);
    }
    return res.status(200).json({ data: inventoryArr });
  } catch (err) {
    console.log("인벤토리 불러 오던 중 오류 발생:", err);
    next(err);
  }
});

// 인벤토리에서 출전 선수 추가 API
router.post("/roster/add", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { playerId } = req.body;

    const getPlayerIdInventory = await prisma.playerInventories.findMany({
      where: { userId: +userId },
      select: {
        playerId: true,
      },
    });

    // 인벤토리에서 추가 할 선수 유무 확인
    let playerIdInventoryArr = [];
    for (let arr of getPlayerIdInventory) {
      playerIdInventoryArr.push(arr.playerId);
    }

    if (!playerIdInventoryArr.includes(+playerId)) {
      return res
        .status(404)
        .json({ message: "해당하는 선수가 인벤토리 안에 존재하지 않습니다." });
    }

    // 출전 선수 명단 3명 이상인지 확인
    const getRosterId = await prisma.rosters.findMany({
      where: { userId: +userId },
      select: { rosterId: true },
    });

    const getRosterIdArr = [];

    for (let rosterId of getRosterId) {
      getRosterIdArr.push(rosterId.rosterId);
    }

    let count = 0;
    for (let i = 0; i < getRosterIdArr.length; i++) {
      count++;
      if (count >= 3) {
        return res
          .status(404)
          .json({ message: "출전 선수 명단이 이미 가득 찼습니다." });
      }
    }

    // 출전 선수 명단과 추가할 선수 이름이 같은지 확인
    const getPlayerIdRoster = await prisma.rosters.findMany({
      where: { userId: +userId },
      select: { playerId: true },
    });

    let getPlayerIdRosterArr = [];

    for (let playerId of getPlayerIdRoster) {
      getPlayerIdRosterArr.push(playerId.playerId);
    }

    if (getPlayerIdRosterArr.includes(+playerId)) {
      return res
        .status(404)
        .json({ message: "출전 선수 명단에 이미 존재 합니다." });
    }

    // 삭제할 선수 인벤토리 아이디 가져오기
    const getInventoryId = await prisma.playerInventories.findFirst({
      where: { playerId: +playerId, userId: +userId },
      select: { inventoryId: true },
    });

    await prisma.$transaction(
      async tx => {
        await tx.rosters.create({
          data: {
            userId: +userId,
            playerId: +playerId,
          },
        });

        await tx.playerInventories.delete({
          where: {
            inventoryId: +Object.values(getInventoryId),
          },
        });
      },
      {
        // 격리수준 설정
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    return res
      .status(200)
      .json({ message: "선수를 출전 선수 목록에 추가 하였습니다." });
  } catch (err) {
    next(err);
  }
});

export default router;
