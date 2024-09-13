import express, { Router } from "express";
import cookieParser from "cookie-parser";
import LogMiddleware from "./src/middlewares/log.middleware.js";
import errorHandlingMiddleware from "./src/middlewares/error-handling.middleware.js";
import dotenv from 'dotenv';

dotenv.config();

// import UsersRouter from "./routes/users.routers.js";
// import CharactersRouter from "./routes/characters.routers.js";
// import ItemsRouter from "./routes/items.routers.js";
const app = express();
const PORT = process.env.port;
app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());
// app.use("/api", [UsersRouter, CharactersRouter, ItemsRouter]);
app.use(errorHandlingMiddleware);
app.set("port", PORT);
app.get("/", (req, res) => {
  res.send("Hello world!");
});
app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});