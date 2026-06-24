import { Request, Response } from "express";
import * as svc from "./worker.service";

// ───────────── Profile (own, worker only) ─────────────
export const createProfile = async (req: Request, res: Response) => {
  res
    .status(201)
    .send({
      success: true,
      data: await svc.createProfile(req.currentUser!.id),
    });
};

export const getOwnProfile = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.getOwnProfile(req.currentUser!.id),
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.updateProfile(req.currentUser!.id, req.body),
  });
};

// ───────────── Education ─────────────
export const addEducation = async (req: Request, res: Response) => {
  const { qualificationId, institute, passoutYear, score } = req.body;
  const result = await svc.addEducation(
    req.currentUser!.id,
    qualificationId,
    institute,
    passoutYear,
    score,
  );
  res.status(201).send({ success: true, data: result });
};

export const updateEducation = async (req: Request, res: Response) => {
  const result = await svc.updateEducation(
    req.currentUser!.id,
    req.params.id as string,
    req.body,
  );
  res.send({ success: true, data: result });
};

export const deleteEducation = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.deleteEducation(
      req.currentUser!.id,
      req.params.id as string,
    ),
  });
};

// ───────────── Experience ─────────────
export const addExperience = async (req: Request, res: Response) => {
  const { companyName, jobTitle, fromDate, toDate, isCurrent, description } =
    req.body;
  const result = await svc.addExperience(
    req.currentUser!.id,
    companyName,
    jobTitle,
    fromDate,
    toDate,
    isCurrent,
    description,
  );
  res.status(201).send({ success: true, data: result });
};

export const updateExperience = async (req: Request, res: Response) => {
  const result = await svc.updateExperience(
    req.currentUser!.id,
    req.params.id as string,
    req.body,
  );
  res.send({ success: true, data: result });
};

export const deleteExperience = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.deleteExperience(
      req.currentUser!.id,
      req.params.id as string,
    ),
  });
};

// ───────────── Recruiter/Admin search ─────────────
export const searchWorkers = async (req: Request, res: Response) => {
  const skillId = req.query.skillId ? Number(req.query.skillId) : undefined;
  const city = req.query.city as string | undefined;
  res.send({
    success: true,
    data: await svc.searchWorkers(req.currentUser!, { skillId, city }),
  });
};

export const getWorkerById = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.getWorkerById(req.params.id as string),
  });
};
