import express, { Router } from "express";
import { prisma } from "../utils/prisma/index.js";

import cookieParser from "cookie-parser";
import LogMiddleware from "../middlewares/log.middleware.js";
import errorHandlingMiddleware from "../middlewares/error-handling.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// 선수 뽑기  /playerDraw  post
router.post('/playerDraw/:userId',/* authMiddleware,*/ async (req, res) => {
  try{
    const userId = Number(req.params.userId);

    const checkCash = await prisma.users.findFirst({
      where: { userId: userId },
    });

    if (checkCash.money < 500){
      return res
      .status(400)
      .json({ message: '소지금이 부족합니다.' });
    }

    const findUser = await prisma.users.update({
      where: { userId: userId },
      data:{
        money: {decrement: 500},
      },
    });

    const dataCount = await prisma.players.count();

    let randomplayer = 1 + Math.floor(Math.random()*dataCount);

    const fillPlayer = await prisma.playerInventories.create({
      data:{
        userId: userId,
        playerId: randomplayer,
      },
    });

  return res.status(200).json({ message: '선수를 영입했습니다.', id: findUser.id, money: findUser.money });
    } catch(e){
        res
      .status(500)
      .json({ error: '로그인 토큰이 만료됐습니다.' });
    }
});

// 캐시 충전  /cash  update
router.post('/cash/:userId',/* authMiddleware,*/ async (req, res) => {
  try{
    const userId = req.params.userId;

    const findUser = await prisma.users.update({
      where: { userId: +userId },
      data:{
        money: {increment: 10000},
      },
    });

  return res.status(200).json({ id: findUser.id, cash_charge: findUser.money });
    } catch(e){
        res
      .status(500)
      .json({ error: '로그인 토큰이 만료됐습니다.' });
    }
});

// 유저 랭킹 조회  /userRanking  get
router.get('/userRanking', async (req, res) => {
    try{
    const posts = await prisma.users.findMany({
        select: {
          userId: false,
          id: true,
          password: false,
          money: false,
          gamePoint: true,
          createdAt: false,
          updatedAt: false,
          gamerecords: {
            select:{
              win:true,
              lose:true,
              draw:true,
            }},
        },
        orderBy: {
          gamePoint: 'desc',
        },
      });
    
      return res.status(200).json({ rankings: posts });
    } catch(e){
        res
      .status(500)
      .json({ error: '랭킹 조회에 실패했습니다.' });
    console.log(error);
    }
});

export default router;