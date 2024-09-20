import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";


export default async function (req, res, next) {
  try {
    const { authorization } = req.cookies; // 쿠키 가져오기
    if (!authorization)
      throw new Error("요청한 사용자의 토큰이 존재하지 않습니다.");

    // authorization "Bearer jwtToken" 배열형태로 분리해서 관리
    const [tokenType, token] = authorization.split(' ');
    if (tokenType !== "Bearer")
      throw new Error("토큰 타입이 Bearer 형식이 아닙니다.");

    const decodedToken = jwt.verify(token, 'custom-secret-key');
    const userId = decodedToken.userId;

    // 사용자 조회
    const user = await prisma.users.findFirst({
      where: { userId: +userId }
    });
    if (!user) 
      throw new Error("토큰 사용자가 존재하지 않습니다.");
    

    // 조회한 유저정보 할당
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return res.status(401).json({ message: "토큰이 만료되었습니다." });
    if (error.name === "JsonWebTokenError")
      return res.status(401).json({ message: "토큰이 조작되었습니다." });
    return res.status(400).json({ message: error.message });
  }
}