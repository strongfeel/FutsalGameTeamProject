import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

const router = express.Router();

// 회원가입 API 구현
router.post("/sign-up", async (req, res, next) => {
  try {
    const { id, password, confirmPassword } = req.body;

    // 유저 아이디 중복 조사
    const isExistUser = await prisma.users.findFirst({
      where: { id },
    });

    if (isExistUser) {
      return res.status(404).json({ message: "이미 존재하는 아이디 입니다." });
    }

    // 비밀번호 생성시 영어 + 숫자조합 구성
    const regex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,20}$/;

    if (!regex.test(password)) {
      return res.status(404).json({
        message:
          "비밀번호는 숫자와 영문자 조합으로 6~20자리를 사용해야 합니다.",
      });
    }

    if (password !== confirmPassword) {
      return res
        .status(404)
        .json({ message: "비밀번호가 일치 하지 않습니다." });
    }

    // 비밀번호 암호화 처리
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(
      async tx => {
        // 유저 정보 만드는 부분
        const user = await tx.users.create({
          data: {
            id,
            password: hashedPassword,
            money: 10000,
            gamePoint: 1000,
          },
        });

        // 유저 화원가입시 유저 게임정보 만드는 부분
        const gameRecord = await tx.gameRecords.create({
          data: {
            userId: user.userId,
            win: 0,
            lose: 0,
            draw: 0,
          },
        });

        // 출전 명단에 기본 선수 배치
        const roster1 = await tx.rosters.create({
          data: {
            userId: user.userId,
            playerId: 71,
          },
        });

        const roster2 = await tx.rosters.create({
          data: {
            userId: user.userId,
            playerId: 73,
          },
        });

        const roster3 = await tx.rosters.create({
          data: {
            userId: user.userId,
            playerId: 74,
          },
        });

        return [user, gameRecord, roster1, roster2, roster3];
      },
      {
        // 격리수준 설정
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );
    return res.status(201).json({ message: "회원가입이 완료되었습니다!" });
  } catch (err) {
    next(err);
  }
});

// 로그인 API 구현
router.post("/sign-in", async (req, res, next) => {
  try {
    const { id, password } = req.body;
    const user = await prisma.users.findFirst({
      where: {
        id,
      },
    });
    if (!user)
      return res.status(404).json({ message: "존재하지 않은 아이디입니다." });
    // 비밀번호 확인 작업
    if (!(await bcrypt.compare(password, user.password)))
      return res.status(404).json({ message: "비밀번호가 일치하지 않습니다." });

    // 유저아이디 정보를 할당하고 custom-secret-key 방식으로 사용
    const token = jwt.sign({ userId: user.userId }, process.env.SECRET_KEY);

    // 쿠키할당
    res.cookie("authorization", `Bearer ${token}`);

    return res.status(200).json({ message: "로그인에 성공하였습니다." });
  } catch (err) {
    next(err);
  }
});

export default router;
