import { Request, Response } from "express";
import * as svc from "./admin.service";

export const getStats = async (req: Request, res: Response) => {
  res.send({ success: true, data: await svc.getStats() });
};

export const createRecruiter = async (req: Request, res: Response) => {
  const { name, email, phone, password, industryIds } = req.body;
  const recruiter = await svc.createRecruiter(
    name,
    email,
    phone,
    password,
    req.currentUser!.id,
    industryIds,
  );
  res.status(201).send({ success: true, data: recruiter });
};

export const listRecruiters = async (req: Request, res: Response) => {
  res.send({ success: true, data: await svc.listRecruiters() });
};

export const getRecruiter = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.getRecruiter(req.params.id as string),
  });
};

export const updateRecruiter = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.updateRecruiter(req.params.id as string, req.body),
  });
};

export const deleteRecruiter = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.deleteRecruiter(req.params.id as string),
  });
};

export const replaceCategories = async (req: Request, res: Response) => {
  const data = await svc.replaceCategories(
    req.params.id as string,
    req.body.industryIds,
  );
  res.send({ success: true, data });
};

export const deactivateRecruiter = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.setRecruiterActive(req.params.id as string, false),
  });
};

export const reactivateRecruiter = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.setRecruiterActive(req.params.id as string, true),
  });
};
