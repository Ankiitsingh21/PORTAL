import express, { Request, Response } from "express";
import authRoutes from "../modules/auth/auth.routes";
import adminRoutes from "../modules/admin/admin.routes";
import masterDataRoutes from "../modules/master-data/master-data.routes";
import workerRoutes from "../modules/worker/worker.routes";
import jobRoutes from "../modules/job/job.routes";
import applicationRoutes from "../modules/application/application.routes";

const router = express.Router();

router.get("/health", (req: Request, res: Response) => res.send({ date: new Date() }));

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/master", masterDataRoutes);
router.use("/worker", workerRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);

export default router;
