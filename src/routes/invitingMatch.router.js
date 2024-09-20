import express from "express";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

// 친선 게임 API
router.post("/play/:opponentId/:userId", async (req, res, next) => {
  const { opponentId } = req.params; // 친선 경기 시 상대편 아이디
  const { userId } = req.params; // 내 유저 아이디

  if (opponentId === userId) {
    return res
      .status(404)
      .json({ message: "친선경기 상대와 당신의 유저가 같습니다." });
  }

  try {
    // 상대 로스터에 저장된 플레이어 아이디 가져오기
    const getOpponentIdRosters = await prisma.rosters.findMany({
      where: { userId: +opponentId },
      select: {
        playerId: true,
      },
    });

    // 상대 playerId 값을 빈배열로 빼오는 작업
    const opponentIdPlayerIdArr = [];

    for (let playerId of getOpponentIdRosters) {
      opponentIdPlayerIdArr.push(playerId.playerId);
    }

    //// 내 로스터에 저장된 플레이어 아이디 가져오기
    const getUserIdRosters = await prisma.rosters.findMany({
      where: { userId: +opponentId },
      select: {
        playerId: true,
      },
    });

    // 내 playerId 값을 빈배열로 빼오는 작업
    const userIdPlayerIdArr = [];

    for (let playerId of getUserIdRosters) {
      userIdPlayerIdArr.push(playerId.playerId);
    }

    // 상대 출전 선수 데이터 불러 오기
    let getPlayerDataForOpponent = [];
    for (let i = 0; i < opponentIdPlayerIdArr.length; i++) {
      const opponent = await prisma.players.findMany({
        where: { playerId: opponentIdPlayerIdArr[i] },
        select: {
          speed: true,
          goalDecision: true,
          goalPower: true,
          defence: true,
          stamina: true,
        },
      });
      getPlayerDataForOpponent.push(opponent);
    }

    // 내 출전 선수 데이터 불러 오기
    let getPlayerDataForUser = [];
    for (let i = 0; i < userIdPlayerIdArr.length; i++) {
      const user = await prisma.players.findMany({
        where: { playerId: userIdPlayerIdArr[i] },
        select: {
          speed: true,
          goalDecision: true,
          goalPower: true,
          defence: true,
          stamina: true,
        },
      });
      getPlayerDataForUser.push(user);
    }

    // 상대편 총 선수 스탯 점수
    let opponentTotalPoint = 0;
    for (let i = 0; i < getPlayerDataForOpponent[0].length; i++) {
      opponentTotalPoint +=
        getPlayerDataForOpponent[0][i].speed * 0.1 +
        getPlayerDataForOpponent[0][i].goalDecision * 0.25 +
        getPlayerDataForOpponent[0][i].goalPower * 0.15 +
        getPlayerDataForOpponent[0][i].defence * 0.3 +
        getPlayerDataForOpponent[0][i].stamina * 0.2;
    }

    // 내 총 선수 스탯 점수
    let userTotalPoint = 0;
    for (let i = 0; i < getPlayerDataForUser[0].length; i++) {
      userTotalPoint +=
        getPlayerDataForUser[0][i].speed * 0.1 +
        getPlayerDataForUser[0][i].goalDecision * 0.25 +
        getPlayerDataForUser[0][i].goalPower * 0.15 +
        getPlayerDataForUser[0][i].defence * 0.3 +
        getPlayerDataForUser[0][i].stamina * 0.2;
    }

    const maxScore = opponentTotalPoint + userTotalPoint;

    const randomValue = Math.random() * maxScore;

    if (randomValue < opponentTotalPoint) {
      // 상대 유저 승리 처리
      const aScore = Math.floor(Math.random() * 4) + 2; // 2에서 5 사이
      const bScore = Math.floor(Math.random() * Math.min(3, aScore)); // aScore보다 작은 값을 설정
      let result = `상대 유저 승리: 상대 팀 ${aScore} - ${bScore} 내 팀`;
      console.log(result);
      return res.status(200).json({ message: result });
    } else {
      // 내 유저 승리 처리
      const bScore = Math.floor(Math.random() * 4) + 2; // 2에서 5 사이
      const aScore = Math.floor(Math.random() * Math.min(3, bScore)); // bScore보다 작은 값을 설정
      let result = `내 승리: 내 팀 ${bScore} - ${aScore} 상대 팀`;
      console.log(result);
      return res.status(200).json({ message: result });
    }
  } catch (err) {
    console.log("게임 실행 시 오류 발생:", err);
    next(err);
  }
});

export default router;
