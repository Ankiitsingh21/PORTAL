import express from "express";
import cookieSession from "cookie-session";
import routes from "./routes/index";
import { errorHandler } from "./common/middlewares";

const app = express();

app.set("trust proxy", true);
app.use(express.json());
app.use(cookieSession({ signed: false, secure: false }));

app.use("/api", routes);

app.use(errorHandler);

export { app };
