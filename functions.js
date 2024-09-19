import express from 'express';
import { prisma } from '.../utils/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

function teampower(){
    let team1 = 0
    router.post('/playerteam', async (req, res, next) => {
        try {
           const { userId } = req.users;
     
           const roster = await prisma.rosters.findMany({
              where: {
                 select: +userId,
              },
     
              select: {
                 playerId: {
                    select: {
                       playerName: true,
                       speed: true,
                       goalDecision: true,
                       goalPower: true,
                       defence: true,
                       stamina: true,
                    },
     
                 },
              },
           });
           return res.status(200), json({ data: roster });
        } catch (err) {
           next(err);
        }
     });
     team1= speed * 0.1 + goalDecision * 0.2 + goalPower * 0.15 + defence * 0.3 + stamina * 0.25;

     return team1;
}

function opponentpower() {
    let team2 = 0;
    router.post('/opponentteam', async (req, res, next) => {
        try {
           const { userId } = req.params;
     
           const roster = await prisma.rosters.findMany({
              where: {
                 select: +userId,
              },
     
              select: {
                 playerId: {
                    select: {
                       playerName: true,
                       speed: true,
                       goalDecision: true,
                       goalPower: true,
                       defence: true,
                       stamina: true,
                    },
     
                 },
              },
           });
           return res.status(200), json({ data: roster });
        } catch (err) {
           next(err);
        }
     });
     team2= speed * 0.1 + goalDecision * 0.2 + goalPower * 0.15 + defence * 0.3 + stamina * 0.25;

     return team2;
}


function gameplay() {
    let round = 0;
    let score1, score2 = 0;

    let diff = team1 - team2;
    let chance1 = Math.round(50 + diff);
    let chance2 = Math.round(50 - diff);

    while (round < 10){
        if(round % 2 ===0){
            if(chance1 > Math.random() * 100){
                score1++;
                console.log('1Team이 득점했습니다!');
            };
        } else {
            if(chance2 > Math.random() * 100){
                score2++;
                console.log('2Team이 득점했습니다!');
            };
        }
        console.log(`${score1} : ${score2}`);
    };

    console.log(`경기 종료\n${score1} : ${score2}`);
    if(score1 > score2)
        console.log('승리');
    else if (score1 < score2)
        console.log('패배');
    else
        console.log('무승부');
}