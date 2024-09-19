import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 인벤토리 목록 조회 API (로그인 후 각자 인벤토리 불러 오기)
router.get("/playerInventory/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

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

// 출전 선수 명단 보기 API
router.get("/roster/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    // 유저 존재 유무 파악
    const getUserId = await prisma.users.findFirst({
      where: { userId: +userId },
    });

    if (!getUserId) {
      return res
        .status(404)
        .json({ message: "해당하는 유저가 존재하지 않습니다." });
    }

    // 해당 유저의 playerId 가져오기
    const getPlayerId = await prisma.rosters.findMany({
      where: { userId: +userId },
      select: { playerId: true },
    });

    // getPlayerId 값을 빈배열로 빼오는 작업
    const playerIdArr = [];

    for (let playerId of getPlayerId) {
      playerIdArr.push(playerId.playerId);
    }

    // 해당하는 선수 데이터 가져오기
    let rosterArr = [];
    for (let i = 0; i < playerIdArr.length; i++) {
      const roster = await prisma.players.findMany({
        where: { playerId: playerIdArr[i] },
        select: {
          playerName: true,
          speed: true,
          goalDecision: true,
          goalPower: true,
          defence: true,
          stamina: true,
          overall: true,
        },
      });
      rosterArr.push(roster);
    }
    return res.status(200).json({ data: rosterArr });
  } catch (err) {
    console.log("출전 선수 목록 불러 오던 중 오류 발생:", err);
    next(err);
  }
});

// 인벤토리에서 출전 선수 추가 API
router.post("/roster/add/:playerId/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { playerId } = req.params;

    const getPlayerIdInventory = await prisma.playerInventories.findMany({
      where: { userId: +userId },
      select: { playerId: true },
    });

    // 인벤토리에서 추가 할 선수 유무 확인
    let playerIdInventoryArr = [];
    for (let playerId of getPlayerIdInventory) {
      playerIdInventoryArr.push(playerId.playerId);
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

    // 인벤토리에서 인벤토리 아이디 하나 가져오기
    const getInventoryId = await prisma.playerInventories.findFirst({
      where: { playerId: +playerId },
      select: { inventoryId: true },
    });

    // 객체 값을 배열로 바꾸기
    const getInventoryIdArr = Object.values(getInventoryId);

    const addRosters = await prisma.$transaction(async tx => {
      await tx.rosters.create({
        data: {
          userId: +userId,
          playerId: +playerId,
        },
      });

      await tx.playerInventories.delete({
        where: { inventoryId: getInventoryIdArr.pop() },
      });
    });

    return res
      .status(200)
      .json({ message: "선수를 출전 선수 목록에 추가 하였습니다." });
  } catch (err) {
    next(err);
  }
});

// 출전선수 명단에서 인벤토리 회수 API
router.post("/roster/remove/:playerId/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { playerId } = req.params;

    const getPlayerId = await prisma.rosters.findMany({
      where: { userId: +userId },
      select: { playerId: true },
    });

    const getPlayerIdArr = [];

    for (let playerId of getPlayerId) {
      getPlayerIdArr.push(playerId.playerId);
    }

    console.log(getPlayerIdArr);

    // 출전선수 명단에서 해당 선수 유무 확인
    if (!getPlayerIdArr.includes(+playerId)) {
      return res.status(404).json({
        message: "해당하는 선수가 출전 선수 명단에 존재하지 않습니다.",
      });
    }

    // 출전 선수 명단에서 rosterId 하나 가져오기
    const getRosterId = await prisma.rosters.findFirst({
      where: { playerId: +playerId },
      select: { rosterId: true },
    });

    // 객체 값을 배열로 바꾸기
    const getRosterIdArr = Object.values(getRosterId);

    const removeRosters = await prisma.$transaction(async tx => {
      await tx.playerInventories.create({
        data: {
          userId: +userId,
          playerId: +playerId,
        },
      });

      await tx.rosters.delete({
        where: { rosterId: getRosterIdArr.pop() },
      });
    });

    return res
      .status(200)
      .json({ message: "출전 선수 명단에서 제외되었습니다." });
  } catch (err) {
    next(err);
  }
});

export default router;
