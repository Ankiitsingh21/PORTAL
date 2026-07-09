"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRoutes = exports.uploadRouter = void 0;
const express_1 = __importDefault(require("express"));
const express_2 = require("uploadthing/express");
const express_3 = require("uploadthing/express");
// import { requireAuth } from "../../common/middlewares";
const middlewares_1 = require("../../common/middlewares");
const db_1 = require("../../config/db");
const f = (0, express_2.createUploadthing)();
exports.uploadRouter = {
    resumeUploader: f({ pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => {
        // @ts-ignore
        if (!req.currentUser)
            throw new Error("Unauthorized");
        // @ts-ignore
        return { userId: req.currentUser.id };
    })
        .onUploadComplete(async ({ metadata, file }) => {
        console.log("Upload complete for userId:", metadata.userId);
        console.log("file url", file.url);
        const worker = await db_1.prisma.workerProfile.findUnique({
            where: { userId: metadata.userId }
        });
        if (worker) {
            await db_1.prisma.workerProfile.update({
                where: { userId: metadata.userId },
                data: { resumeUrl: file.url }
            });
        }
    }),
};
const router = express_1.default.Router();
exports.uploadRoutes = router;
router.use("/", middlewares_1.loadCurrentUser, (0, express_3.createRouteHandler)({
    router: exports.uploadRouter
}));
