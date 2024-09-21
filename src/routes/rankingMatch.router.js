import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 랭킹 게임 API
router.post("/play", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  // 내 출전 선수가 3명 미만이라면 오류 발생
  const checkPlayerCount = await prisma.rosters.findMany({
    where: { userId: +userId },
    select: { playerId: true },
  });

  if (checkPlayerCount.length < 3) {
    return res
      .status(404)
      .json({ message: "출전 선수 명단에 3명의 선수가 준비 되어야 합니다." });
  }

  try {
    // 유저 게임포인트 가져오기
    const getUserGamePoint = await prisma.users.findFirst({
      where: { userId: +userId },
      select: { gamePoint: true },
    });

    const getPlayerGamePoint = await prisma.users.findMany({
      select: {
        userId: true,
        gamePoint: true,
      },
      orderBy: { gamePoint: "desc" },
    });

    // 게임 포인트로 정렬된 유저 아이디 배열
    const getUserIdArr = [];

    for (let userId of getPlayerGamePoint) {
      getUserIdArr.push(userId.userId);
    }

    // 게임 포인트로 게임 매칭
    let opponentId;
    let highRankId;
    let lowRankId;
    for (let i = 0; i < getUserIdArr.length; i++) {
      // 유저 아이디 배열에서 내 유저 아이디를 찾고
      if (+userId === getUserIdArr[i]) {
        // 내가 꼴지라면 나보다 한단계 위의 유저와 매칭
        if (i === getUserIdArr.length - 1) {
          opponentId = getUserIdArr[i - 1];
        } else if (i === 0) {
          // 내가 1등이라면 나보다 한단계 밑의 유저와 매칭
          opponentId = getUserIdArr[i + 1];
        } else {
          // 꼴지가 아니라면 내 위의 랭킹 점수와 내 밑의 랭킹 점수의 차가 적은 유저와 매칭
          lowRankId = getUserIdArr[i + 1];

          // lowRankId 게임 포인트 가져오기
          const getLowGamePoint = await prisma.users.findFirst({
            where: { userId: +lowRankId },
            select: { gamePoint: true },
          });

          highRankId = getUserIdArr[i - 1];

          // highRankId 게임 포인트 가져오기
          const getHighGamePoint = await prisma.users.findFirst({
            where: { userId: +lowRankId },
            select: { gamePoint: true },
          });

          let subtractionLow =
            Object.values(getUserGamePoint) - Object.values(getLowGamePoint);
          let subtractionHigh =
            Object.values(getHighGamePoint) - Object.values(getUserGamePoint);

          if (subtractionLow < subtractionHigh) {
            opponentId = lowRankId;
          } else if (subtractionLow > subtractionHigh) {
            opponentId = highRankId;
          } else {
            // 차이가 같을 경우
            opponentId = lowRankId;
          }
        }
      }
    }

    // 상대 게임 포인트 가져오기
    const getOpponentGamePoint = await prisma.users.findFirst({
      where: { userId: +opponentId },
      select: { gamePoint: true },
    });

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

    // 내 로스터에 저장된 플레이어 아이디 가져오기
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

      // 게임 승패 및 점수 업데이트 부분
      await prisma.$transaction(async tx => {
        // 상대편 승리 시 승 +1
        await tx.gameRecords.update({
          where: { userId: +opponentId },
          data: { win: +1 },
        });

        // 상대편 승리 시 내 패 +1
        await tx.gameRecords.update({
          where: { userId: +userId },
          data: {
            lose: +1,
          },
        });

        // 상대편 승리 시 +50점
        await tx.users.update({
          where: { userId: +opponentId },
          data: {
            gamePoint: { increment: 50 },
          },
        });

        // 내 패배 시 -30점
        await tx.users.update({
          where: { userId: +userId },
          data: { gamePoint: { decrement: 30 } },
        });

        // 점수가 30점보다 작을시 0점으로 바꿈)
        if (Object.values(getUserGamePoint) <= 30) {
          await tx.users.update({
            where: { userId: +userId },
            data: {
              gamePoint: 0,
            },
          });
        }
      });

      return res.status(200).json(`${result}. 점수가 30점 하락 합니다.`);
    } else {
      // 내 유저 승리 처리
      const bScore = Math.floor(Math.random() * 4) + 2; // 2에서 5 사이
      const aScore = Math.floor(Math.random() * Math.min(3, bScore)); // bScore보다 작은 값을 설정
      let result = `내 승리: 내 팀 ${bScore} - ${aScore} 상대 팀`;

      await prisma.$transaction(async tx => {
        // 내가 승리 시 승 +1
        await tx.gameRecords.update({
          where: { userId: +userId },
          data: {
            win: +1,
          },
        });

        // 내가 승리 시 상대 패 +1
        await tx.gameRecords.update({
          where: { userId: +opponentId },
          data: {
            lose: +1,
          },
        });

        // 내가 승리 시 +50점
        await tx.users.update({
          where: { userId: +userId },
          data: {
            gamePoint: { increment: 50 },
          },
        });

        // 상대 패배 시 -30점
        await tx.users.update({
          where: { userId: +opponentId },
          data: { gamePoint: { decrement: 30 } },
        });

        // 점수가 30점보다 작을시 0점으로 바꿈
        if (Object.values(getOpponentGamePoint) <= 30) {
          await tx.users.update({
            where: { userId: +opponentId },
            data: {
              gamePoint: 0,
            },
          });
        }
      });

      return res.status(200).json(`${result}. 점수가 50점 상승 합니다.`);
    }
  } catch (err) {
    console.log("게임 실행 시 오류 발생:", err);
    next(err);
  }
});

export default router;
