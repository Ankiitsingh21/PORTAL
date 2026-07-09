import express from "express";
import cookieSession from "cookie-session";
import routes from "./routes/index";
import { errorHandler } from "./common/middlewares";

const app = express();

app.set("trust proxy", true);

// CORS - Allow all frontend origins
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Reflect any requesting origin
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  // Reflect whatever headers the browser's preflight is asking permission
  // for (same idea as reflecting Origin above), instead of a fixed list.
  // A hard-coded list broke UploadThing's client, which sends its own
  // x-uploadthing-package / x-uploadthing-version / tracing headers that
  // weren't in the old fixed list — those failed preflight and the browser
  // silently refused to send the real request.
  const requestedHeaders = req.headers["access-control-request-headers"];
  res.header(
    "Access-Control-Allow-Headers",
    requestedHeaders || "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

app.use(
  cookieSession({
    signed: false,
    secure: false,
  })
);

app.use("/api", routes);

app.use(errorHandler);

export { app };