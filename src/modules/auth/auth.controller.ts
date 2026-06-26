import { Request, Response } from "express";
import * as svc from "./auth.service";

export const registerWorker = async (req: Request, res: Response) => {
  const { email, password, phone } = req.body;
  const result = await svc.registerWorker(email, password, phone);
  res.status(201).send({ success: true, data: result, message: "OTP sent" });
};

export const verifyWorkerOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  // console.log(phone);
  const result = await svc.verifyWorkerOtp(phone, otp);
  req.session = { jwt: result.token };
  res.send({ success: true, data: result });
};

export const resendWorkerOtp = async (req: Request, res: Response) => {
  const result = await svc.resendWorkerOtp(req.body.phone);
  res.send({ success: true, data: result, message: "OTP resent" });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await svc.login(email, password);
  req.session = { jwt: result.token };
  res.send({ success: true, data: result });
};

export const logout = (req: Request, res: Response) => {
  req.session = null;
  res.send({ success: true });
};

export const me = async (req: Request, res: Response) => {
  const user = await svc.getCurrentUser(req.currentUser!.id);
  if (!user) {
    req.session = null;
    return res.send({ success: true, data: null });
  }
  res.send({ success: true, data: user });
};
