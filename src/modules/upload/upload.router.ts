import express from 'express';
import { createUploadthing, type FileRouter } from "uploadthing/express";
import { createRouteHandler } from "uploadthing/express";
// import { requireAuth } from "../../common/middlewares";
import { loadCurrentUser } from "../../common/middlewares";
import { prisma } from "../../config/db";

const f = createUploadthing();

export const uploadRouter = {
  resumeUploader: f({ pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // @ts-ignore
      if (!req.currentUser) throw new Error("Unauthorized");
      // @ts-ignore
      return { userId: req.currentUser.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      
      const worker = await prisma.workerProfile.findUnique({
        where: { userId: metadata.userId }
      });
      if (worker) {
        await prisma.workerProfile.update({
          where: { userId: metadata.userId },
          data: { resumeUrl: file.url }
        });
      }
    }),
} satisfies FileRouter;

const router = express.Router();

router.use("/", loadCurrentUser, createRouteHandler({
  router: uploadRouter
}));

export { router as uploadRoutes };
