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
exports.reactivateRecruiter = exports.deactivateRecruiter = exports.replaceCategories = exports.deleteRecruiter = exports.updateRecruiter = exports.getRecruiter = exports.listRecruiters = exports.createRecruiter = exports.getStats = void 0;
const svc = __importStar(require("./admin.service"));
const getStats = async (req, res) => {
    res.send({ success: true, data: await svc.getStats() });
};
exports.getStats = getStats;
const createRecruiter = async (req, res) => {
    const { name, email, phone, password, industryIds } = req.body;
    const recruiter = await svc.createRecruiter(name, email, phone, password, req.currentUser.id, industryIds);
    res.status(201).send({ success: true, data: recruiter });
};
exports.createRecruiter = createRecruiter;
const listRecruiters = async (req, res) => {
    res.send({ success: true, data: await svc.listRecruiters() });
};
exports.listRecruiters = listRecruiters;
const getRecruiter = async (req, res) => {
    res.send({
        success: true,
        data: await svc.getRecruiter(req.params.id),
    });
};
exports.getRecruiter = getRecruiter;
const updateRecruiter = async (req, res) => {
    res.send({
        success: true,
        data: await svc.updateRecruiter(req.params.id, req.body),
    });
};
exports.updateRecruiter = updateRecruiter;
const deleteRecruiter = async (req, res) => {
    res.send({
        success: true,
        data: await svc.deleteRecruiter(req.params.id),
    });
};
exports.deleteRecruiter = deleteRecruiter;
const replaceCategories = async (req, res) => {
    const data = await svc.replaceCategories(req.params.id, req.body.industryIds);
    res.send({ success: true, data });
};
exports.replaceCategories = replaceCategories;
const deactivateRecruiter = async (req, res) => {
    res.send({
        success: true,
        data: await svc.setRecruiterActive(req.params.id, false),
    });
};
exports.deactivateRecruiter = deactivateRecruiter;
const reactivateRecruiter = async (req, res) => {
    res.send({
        success: true,
        data: await svc.setRecruiterActive(req.params.id, true),
    });
};
exports.reactivateRecruiter = reactivateRecruiter;
