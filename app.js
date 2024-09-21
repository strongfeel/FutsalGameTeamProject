import express from "express";
import cookieParser from "cookie-parser";
import LogMiddleware from "./src/middlewares/log.middleware.js";
import errorHandlingMiddleware from "./src/middlewares/error-handling.middleware.js";
import InventoryRouter from "./src/routes/playerInventory.router.js"; // 인벤토리 라우터 링크 추가 부분 추가
import InvitingMatchRouter from "./src/routes/invitingMatch.router.js"; // 친선경기 라우터 링크 추가 부분 추가
import RankingMatchRouter from "./src/routes/rankingMatch.router.js"; // 랭킹경기 라우터 링크 추가 부분 추가
import CashShopRouter from "./src/routes/cashShop.router.js"; // 캐시뽑기 & 선수뽑기 & 랭킹 조회 라우터 링크 추가 부분 추가
import UsersRouter from "./src/routes/user.router.js"; // 회원가입 & 로그인 라우터 링크 추가 부분 추가
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.port;

app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());

app.use("/api", [
  InventoryRouter,
  InvitingMatchRouter,
  RankingMatchRouter,
  CashShopRouter,
  UsersRouter,
]); // 라우터 사용 부분 추가

app.use(errorHandlingMiddleware);

app.set("port", PORT);

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
