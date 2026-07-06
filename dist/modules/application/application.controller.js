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
exports.withdrawApplication = exports.updateStatus = exports.getApplication = exports.listApplicationsForJob = exports.listRecruiterApplications = exports.listMyApplications = exports.listAllApplications = exports.applyToJob = void 0;
const svc = __importStar(require("./application.service"));
const applyToJob = async (req, res) => {
    const app = await svc.applyToJob(req.currentUser.id, req.body.jobId, req.body.coverNote);
    res.status(201).send({ success: true, data: app });
};
exports.applyToJob = applyToJob;
const listAllApplications = async (req, res) => {
    res.send({
        success: true,
        data: await svc.listAllApplications(),
    });
};
exports.listAllApplications = listAllApplications;
const listMyApplications = async (req, res) => {
    res.send({
        success: true,
        data: await svc.listMyApplications(req.currentUser.id),
    });
};
exports.listMyApplications = listMyApplications;
const listRecruiterApplications = async (req, res) => {
    res.send({
        success: true,
        data: await svc.listRecruiterApplications(req.currentUser),
    });
};
exports.listRecruiterApplications = listRecruiterApplications;
const listApplicationsForJob = async (req, res) => {
    const data = await svc.listApplicationsForJob(req.params.jobId, req.currentUser);
    res.send({ success: true, data });
};
exports.listApplicationsForJob = listApplicationsForJob;
const getApplication = async (req, res) => {
    res.send({
        success: true,
        data: await svc.getApplication(req.params.id, req.currentUser),
    });
};
exports.getApplication = getApplication;
const updateStatus = async (req, res) => {
    const app = await svc.updateStatus(req.params.id, req.currentUser, req.body.status, req.body.notes);
    res.send({ success: true, data: app });
};
exports.updateStatus = updateStatus;
const withdrawApplication = async (req, res) => {
    res.send({
        success: true,
        data: await svc.withdrawApplication(req.params.id, req.currentUser.id),
    });
};
exports.withdrawApplication = withdrawApplication;
