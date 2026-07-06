"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignJob = exports.deleteJob = exports.updateJobStatus = exports.updateJob = exports.getJob = exports.listJobs = exports.createJob = void 0;
const svc = __importStar(require("./job.service"));
const createJob = async (req, res) => {
    const job = await svc.createJob(req.currentUser.id, req.body);
    res.status(201).send({ success: true, data: job });
};
exports.createJob = createJob;
const listJobs = async (req, res) => {
    const jobs = await svc.listJobs(req.currentUser?.role, req.currentUser?.id);
    res.send({ success: true, data: jobs });
};
exports.listJobs = listJobs;
const getJob = async (req, res) => {
    res.send({
        success: true,
        data: await svc.getJobForUser(req.params.id, req.currentUser),
    });
};
exports.getJob = getJob;
const updateJob = async (req, res) => {
    const job = await svc.updateJob(req.params.id, req.currentUser, req.body);
    res.send({ success: true, data: job });
};
exports.updateJob = updateJob;
const updateJobStatus = async (req, res) => {
    const job = await svc.updateJobStatus(req.params.id, req.currentUser, req.body.status);
    res.send({ success: true, data: job });
};
exports.updateJobStatus = updateJobStatus;
const deleteJob = async (req, res) => {
    res.send({
        success: true,
        data: await svc.deleteJob(req.params.id, req.currentUser),
    });
};
exports.deleteJob = deleteJob;
const assignJob = async (req, res) => {
    const job = await svc.assignJobToRecruiter(req.params.id, req.body.recruiterUserId);
    res.send({ success: true, data: job });
};
exports.assignJob = assignJob;
