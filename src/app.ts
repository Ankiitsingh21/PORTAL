import express from "express";
import cookieSession from "cookie-session";
import routes from "./routes/index";
import { errorHandler } from "./common/middlewares";

const app = express();

app.set("trust proxy", true);
app.use((req, res, next) => {
  const configuredOrigins = (
    process.env.CORS_ORIGIN ??
    process.env.FRONTEND_URL ??
    "http://localhost:3001,http://localhost:3002,http://localhost:3003"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const requestOrigin = req.headers.origin;
  const allowAnyOrigin = configuredOrigins.includes("*");

  if (requestOrigin && (allowAnyOrigin || configuredOrigins.includes(requestOrigin))) {
    res.header("Access-Control-Allow-Origin", requestOrigin);
    res.header("Vary", "Origin");
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  // console.log("ih");
  next();
});
app.use(express.json());
app.use(cookieSession({ signed: false, secure: false }));

app.use("/api", routes);

app.use(errorHandler);

export { app };
