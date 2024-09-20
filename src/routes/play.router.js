import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import functions from './function.js';

router.post('/play/custom', async (req, res, next) => {
   try {
      const { userId } = req.users;

      let roster1 = [];
      for (i = 0; i < playerIdArr.length; i++) {
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
         roster1.push(roster);
      }
      let team1 = 0;
      for (i = 0; i < roster1.length; i++) {
         team1 += roster1[i][1] * 0.1 + roster1[i][2] * 0.2 + roster1[i][3] * 0.15 + roster1[i][4] * 0.3 + roster1[i][5] * 0.25;
      }

      const { opponentId } = req.params;

      let roster2 = [];
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
         roster2.push(roster);
      }
      let team2 = 0;
      for (i = 0; i < roster2.length; i++) {
         team1 += roster2[i][1] * 0.1 + roster2[i][2] * 0.2 + roster2[i][3] * 0.15 + roster2[i][4] * 0.3 + roster2[i][5] * 0.25;
      }

      let round = 0;
      let score1, score2 = 0;

      let diff = team1 - team2;
      let chance1 = Math.round(50 + diff);
      let chance2 = Math.round(50 - diff);

      while (round < 10) {
         if (round % 2 === 0) {
            if (chance1 > Math.random() * 100) {
               score1++;
               console.log('1Team이 득점했습니다!');
            };
         } else {
            if (chance2 > Math.random() * 100) {
               score2++;
               console.log('2Team이 득점했습니다!');
            };
         }
         console.log(`${score1} : ${score2}`);
      };

      console.log(`경기 종료\n${score1} : ${score2}`);
      if (score1 > score2) {
         return res.status(200).json({ message: '승리' });
      }
      else if (score1 < score2) {
         return res.status(200).json({ message: '패배' });
      }
      else {
         return res.status(200).json({ message: '무승부' });
      }
   } catch (err) {
      next(err);
   }
});

router.post('/play/rank', async (req, res, next) => {
   try {
      const { userId } = req.users;

      let roster1 = [];
      for (i = 0; i < playerIdArr.length; i++) {
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
         roster1.push(roster);
      }
      let team1 = 0;
      for (i = 0; i < roster1.length; i++) {
         team1 += roster1[i][1] * 0.1 + roster1[i][2] * 0.2 + roster1[i][3] * 0.15 + roster1[i][4] * 0.3 + roster1[i][5] * 0.25;
      }

      const { opponentId } = req.params;

      let roster2 = [];
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
         roster2.push(roster);
      }
      let team2 = 0;
      for (i = 0; i < roster2.length; i++) {
         team1 += roster2[i][1] * 0.1 + roster2[i][2] * 0.2 + roster2[i][3] * 0.15 + roster2[i][4] * 0.3 + roster2[i][5] * 0.25;
      }

      let round = 0;
      let score1, score2 = 0;

      let diff = team1 - team2;
      let chance1 = Math.round(50 + diff);
      let chance2 = Math.round(50 - diff);

      while (round < 10) {
         if (round % 2 === 0) {
            if (chance1 > Math.random() * 100) {
               score1++;
               console.log('1Team이 득점했습니다!');
            };
         } else {
            if (chance2 > Math.random() * 100) {
               score2++;
               console.log('2Team이 득점했습니다!');
            };
         }
         console.log(`${score1} : ${score2}`);
      };

      console.log(`경기 종료\n${score1} : ${score2}`);
      await prisma.$transaction(
         async (tx) => {
            if (score1 > score2) {
               await tx.users.update({
                  where: {userId},
                  select: {gamepoint},
                  data: (gamepoint, + 25),
               })
               return res.status(200).json({ message: `승리/n현재 GP: ${gamepoint}` });
            }
            else if (score1 < score2) {
               await tx.users.update({
                  where: {userId},
                  select: {gamepoint},
                  data: (gamepoint, - 25),
               })
               return res.status(200).json({ message: `패배/n현재 GP: ${gamepoint}` });
            }
            else {
               return res.status(200).json({ message: `무승부/n현재 GP: ${gamepoint}` });
            }
         }
      )
   } catch (err) {
      next(err);
   }
})

export default router;