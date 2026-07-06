import { Request, Response } from "express";
import * as svc from "./master-data.service";

// ───────────── Locations ─────────────
export const getLocations = async (req: Request, res: Response) => {
  res.send({ success: true, data: await svc.listLocations() });
};

export const getCities = async (req: Request, res: Response) => {
  res.send({ success: true, data: await svc.listCities() });
};

export const getLocalitiesByCity = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.listLocalitiesByCity(req.params.city as string),
  });
};

export const createLocation = async (req: Request, res: Response) => {
  const { state, city, locality } = req.body;
  res
    .status(201)
    .send({
      success: true,
      data: await svc.createLocation(state, city, locality),
    });
};

export const updateLocation = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.updateLocation(Number(req.params.id), req.body),
  });
};

export const deleteLocation = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.deleteLocation(Number(req.params.id)),
  });
};

// ───────────── Generic factory for industries / functions / skills / languages ─────────────
export const makeSimpleResourceHandlers = (resource: {
  list: () => Promise<any>;
  create: (name: string) => Promise<any>;
  update: (id: number, data: any) => Promise<any>;
  remove: (id: number) => Promise<any>;
}) => ({
  list: async (req: Request, res: Response) =>
    res.send({ success: true, data: await resource.list() }),
  create: async (req: Request, res: Response) =>
    res
      .status(201)
      .send({ success: true, data: await resource.create(req.body.name) }),
  update: async (req: Request, res: Response) =>
    res.send({
      success: true,
      data: await resource.update(Number(req.params.id), req.body),
    }),
  remove: async (req: Request, res: Response) =>
    res.send({
      success: true,
      data: await resource.remove(Number(req.params.id)),
    }),
});

// ───────────── Job roles ─────────────
export const getJobRoles = async (req: Request, res: Response) => {
  const functionId = req.query.function_id
    ? Number(req.query.function_id)
    : undefined;
  res.send({ success: true, data: await svc.listJobRoles(functionId) });
};

export const createJobRole = async (req: Request, res: Response) => {
  res
    .status(201)
    .send({
      success: true,
      data: await svc.createJobRole(req.body.name, req.body.functionId),
    });
};

export const updateJobRole = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.updateJobRole(Number(req.params.id), req.body),
  });
};

export const deleteJobRole = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.deleteJobRole(Number(req.params.id)),
  });
};

// ───────────── Qualifications ─────────────
export const getQualifications = async (req: Request, res: Response) => {
  res.send({ success: true, data: await svc.listQualifications() });
};

export const createQualification = async (req: Request, res: Response) => {
  res
    .status(201)
    .send({
      success: true,
      data: await svc.createQualification(req.body.name, req.body.level),
    });
};


export const updateQualification = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.updateQualification(Number(req.params.id), req.body),
  });
};

export const deleteQualification = async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await svc.deleteQualification(Number(req.params.id)),
  });
};
