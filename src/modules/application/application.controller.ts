import { Request, Response } from "express";
import * as svc from "./application.service";

export const applyToJob = async (req: Request, res: Response) => {
  const app = await svc.applyToJob(
    req.currentUser!.id,
    req.body.jobId,
    req.body.coverNote,
  );
  res.status(201).send({ success: true, data: app });
};

export const listMyApplications = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.listMyApplications(req.currentUser!.id),
  });
};

export const listApplicationsForJob = async (req: Request, res: Response) => {
  const data = await svc.listApplicationsForJob(
    req.params.jobId as string,
    req.currentUser!,
  );
  res.send({ success: true, data });
};

export const getApplication = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.getApplication(req.params.id as string, req.currentUser!),
  });
};

export const updateStatus = async (req: Request, res: Response) => {
  const app = await svc.updateStatus(
    req.params.id as string,
    req.currentUser!,
    req.body.status,
    req.body.notes,
  );
  res.send({ success: true, data: app });
};

export const withdrawApplication = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.withdrawApplication(
      req.params.id as string,
      req.currentUser!.id,
    ),
  });
};
