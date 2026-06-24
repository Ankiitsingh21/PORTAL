"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterDataRepository = void 0;
const db_1 = require("../../config/db");
function buildSimpleResourceRepo(modelName) {
    const model = db_1.prisma[modelName];
    return {
        list: () => model.findMany({ where: { isActive: true } }),
        findByName: (name) => model.findUnique({ where: { name } }),
        create: (name) => model.create({ data: { name } }),
        update: (id, data) => model.update({ where: { id }, data }),
        deactivate: (id) => model.update({ where: { id }, data: { isActive: false } }),
    };
}
class MasterDataRepository {
    constructor() {
        this.industries = buildSimpleResourceRepo("industry");
        this.functions = buildSimpleResourceRepo("jobFunction");
        this.skills = buildSimpleResourceRepo("skill");
        this.languages = buildSimpleResourceRepo("language");
    }
    // ───────────── Locations ─────────────
    listLocations() {
        return db_1.prisma.location.findMany({ where: { isActive: true } });
    }
    listCities() {
        return db_1.prisma.location
            .findMany({
            where: { isActive: true },
            select: { city: true },
            distinct: ["city"],
        })
            .then((rows) => rows.map((r) => r.city));
    }
    listLocalitiesByCity(city) {
        return db_1.prisma.location.findMany({ where: { city, isActive: true } });
    }
    createLocation(state, city, locality) {
        return db_1.prisma.location.create({ data: { state, city, locality } });
    }
    updateLocation(id, data) {
        return db_1.prisma.location.update({ where: { id }, data });
    }
    deactivateLocation(id) {
        return db_1.prisma.location.update({ where: { id }, data: { isActive: false } });
    }
    // ───────────── Job roles (has functionId) ─────────────
    listJobRoles(functionId) {
        return db_1.prisma.jobRole.findMany({
            where: { isActive: true, ...(functionId ? { functionId } : {}) },
        });
    }
    createJobRole(name, functionId) {
        return db_1.prisma.jobRole.create({ data: { name, functionId } });
    }
    updateJobRole(id, data) {
        return db_1.prisma.jobRole.update({ where: { id }, data });
    }
    deactivateJobRole(id) {
        return db_1.prisma.jobRole.update({ where: { id }, data: { isActive: false } });
    }
    // ───────────── Qualifications (has level) ─────────────
    listQualifications() {
        return db_1.prisma.qualification.findMany({ where: { isActive: true } });
    }
    createQualification(name, level) {
        return db_1.prisma.qualification.create({ data: { name, level } });
    }
}
exports.MasterDataRepository = MasterDataRepository;
