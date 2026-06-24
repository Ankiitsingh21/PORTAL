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
exports.getWorkerById = exports.searchWorkers = exports.deleteExperience = exports.updateExperience = exports.addExperience = exports.deleteEducation = exports.updateEducation = exports.addEducation = exports.updateProfile = exports.getOwnProfile = exports.createProfile = void 0;
const svc = __importStar(require("./worker.service"));
// ───────────── Profile (own, worker only) ─────────────
const createProfile = async (req, res) => {
    res
        .status(201)
        .send({
        success: true,
        data: await svc.createProfile(req.currentUser.id),
    });
};
exports.createProfile = createProfile;
const getOwnProfile = async (req, res) => {
    res.send({
        success: true,
        data: await svc.getOwnProfile(req.currentUser.id),
    });
};
exports.getOwnProfile = getOwnProfile;
const updateProfile = async (req, res) => {
    res.send({
        success: true,
        data: await svc.updateProfile(req.currentUser.id, req.body),
    });
};
exports.updateProfile = updateProfile;
// ───────────── Education ─────────────
const addEducation = async (req, res) => {
    const { qualificationId, institute, passoutYear, score } = req.body;
    const result = await svc.addEducation(req.currentUser.id, qualificationId, institute, passoutYear, score);
    res.status(201).send({ success: true, data: result });
};
exports.addEducation = addEducation;
const updateEducation = async (req, res) => {
    const result = await svc.updateEducation(req.currentUser.id, req.params.id, req.body);
    res.send({ success: true, data: result });
};
exports.updateEducation = updateEducation;
const deleteEducation = async (req, res) => {
    res.send({
        success: true,
        data: await svc.deleteEducation(req.currentUser.id, req.params.id),
    });
};
exports.deleteEducation = deleteEducation;
// ───────────── Experience ─────────────
const addExperience = async (req, res) => {
    const { companyName, jobTitle, fromDate, toDate, isCurrent, description } = req.body;
    const result = await svc.addExperience(req.currentUser.id, companyName, jobTitle, fromDate, toDate, isCurrent, description);
    res.status(201).send({ success: true, data: result });
};
exports.addExperience = addExperience;
const updateExperience = async (req, res) => {
    const result = await svc.updateExperience(req.currentUser.id, req.params.id, req.body);
    res.send({ success: true, data: result });
};
exports.updateExperience = updateExperience;
const deleteExperience = async (req, res) => {
    res.send({
        success: true,
        data: await svc.deleteExperience(req.currentUser.id, req.params.id),
    });
};
exports.deleteExperience = deleteExperience;
// ───────────── Recruiter/Admin search ─────────────
const searchWorkers = async (req, res) => {
    const skillId = req.query.skillId ? Number(req.query.skillId) : undefined;
    const city = req.query.city;
    res.send({
        success: true,
        data: await svc.searchWorkers(req.currentUser, { skillId, city }),
    });
};
exports.searchWorkers = searchWorkers;
const getWorkerById = async (req, res) => {
    res.send({
        success: true,
        data: await svc.getWorkerById(req.params.id),
    });
};
exports.getWorkerById = getWorkerById;
