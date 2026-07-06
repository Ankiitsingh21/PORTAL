import { Request, Response } from "express";
import * as svc from "./job.service";

export const createJob = async (req: Request, res: Response) => {
  const job = await svc.createJob(req.currentUser!.id, req.body);
  res.status(201).send({ success: true, data: job });
};

export const listJobs = async (req: Request, res: Response) => {
  const jobs = await svc.listJobs(req.currentUser?.role, req.currentUser?.id);
  res.send({ success: true, data: jobs });
};

export const getJob = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.getJobForUser(req.params.id as string, req.currentUser),
  });
};

export const updateJob = async (req: Request, res: Response) => {
  const job = await svc.updateJob(
    req.params.id as string,
    req.currentUser!,
    req.body,
  );
  res.send({ success: true, data: job });
};

export const updateJobStatus = async (req: Request, res: Response) => {
  const job = await svc.updateJobStatus(
    req.params.id as string,
    req.currentUser!,
    req.body.status,
  );
  res.send({ success: true, data: job });
};

export const deleteJob = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.deleteJob(req.params.id as string, req.currentUser!),
  });
};

export const assignJob = async (req: Request, res: Response) => {
  const job = await svc.assignJobToRecruiter(
    req.params.id as string,
    req.body.recruiterUserId,
  );
  res.send({ success: true, data: job });
};
