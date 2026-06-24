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
exports.createQualification = exports.getQualifications = exports.deleteJobRole = exports.updateJobRole = exports.createJobRole = exports.getJobRoles = exports.makeSimpleResourceHandlers = exports.deleteLocation = exports.updateLocation = exports.createLocation = exports.getLocalitiesByCity = exports.getCities = exports.getLocations = void 0;
const svc = __importStar(require("./master-data.service"));
// ───────────── Locations ─────────────
const getLocations = async (req, res) => {
    res.send({ success: true, data: await svc.listLocations() });
};
exports.getLocations = getLocations;
const getCities = async (req, res) => {
    res.send({ success: true, data: await svc.listCities() });
};
exports.getCities = getCities;
const getLocalitiesByCity = async (req, res) => {
    res.send({
        success: true,
        data: await svc.listLocalitiesByCity(req.params.city),
    });
};
exports.getLocalitiesByCity = getLocalitiesByCity;
const createLocation = async (req, res) => {
    const { state, city, locality } = req.body;
    res
        .status(201)
        .send({
        success: true,
        data: await svc.createLocation(state, city, locality),
    });
};
exports.createLocation = createLocation;
const updateLocation = async (req, res) => {
    res.send({
        success: true,
        data: await svc.updateLocation(Number(req.params.id), req.body),
    });
};
exports.updateLocation = updateLocation;
const deleteLocation = async (req, res) => {
    res.send({
        success: true,
        data: await svc.deleteLocation(Number(req.params.id)),
    });
};
exports.deleteLocation = deleteLocation;
// ───────────── Generic factory for industries / functions / skills / languages ─────────────
const makeSimpleResourceHandlers = (resource) => ({
    list: async (req, res) => res.send({ success: true, data: await resource.list() }),
    create: async (req, res) => res
        .status(201)
        .send({ success: true, data: await resource.create(req.body.name) }),
    update: async (req, res) => res.send({
        success: true,
        data: await resource.update(Number(req.params.id), req.body),
    }),
    remove: async (req, res) => res.send({
        success: true,
        data: await resource.remove(Number(req.params.id)),
    }),
});
exports.makeSimpleResourceHandlers = makeSimpleResourceHandlers;
// ───────────── Job roles ─────────────
const getJobRoles = async (req, res) => {
    const functionId = req.query.function_id
        ? Number(req.query.function_id)
        : undefined;
    res.send({ success: true, data: await svc.listJobRoles(functionId) });
};
exports.getJobRoles = getJobRoles;
const createJobRole = async (req, res) => {
    res
        .status(201)
        .send({
        success: true,
        data: await svc.createJobRole(req.body.name, req.body.functionId),
    });
};
exports.createJobRole = createJobRole;
const updateJobRole = async (req, res) => {
    res.send({
        success: true,
        data: await svc.updateJobRole(Number(req.params.id), req.body),
    });
};
exports.updateJobRole = updateJobRole;
const deleteJobRole = async (req, res) => {
    res.send({
        success: true,
        data: await svc.deleteJobRole(Number(req.params.id)),
    });
};
exports.deleteJobRole = deleteJobRole;
// ───────────── Qualifications ─────────────
const getQualifications = async (req, res) => {
    res.send({ success: true, data: await svc.listQualifications() });
};
exports.getQualifications = getQualifications;
const createQualification = async (req, res) => {
    res
        .status(201)
        .send({
        success: true,
        data: await svc.createQualification(req.body.name, req.body.level),
    });
};
exports.createQualification = createQualification;
