"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQualification = exports.updateQualification = exports.createQualification = exports.listQualifications = exports.deleteJobRole = exports.updateJobRole = exports.createJobRole = exports.listJobRoles = exports.deleteLocation = exports.updateLocation = exports.createLocation = exports.listLocalitiesByCity = exports.listCities = exports.listLocations = exports.languages = exports.skills = exports.functions = exports.industries = void 0;
const master_data_repository_1 = require("./master-data.repository");
const errors_1 = require("../../common/errors");
const repo = new master_data_repository_1.MasterDataRepository();
function buildSimpleResourceService(resource) {
    return {
        list: () => resource.list(),
        create: async (name) => {
            const existing = await resource.findByName(name);
            if (existing)
                throw new errors_1.BadRequestError(`${name} already exists`);
            return resource.create(name);
        },
        update: (id, data) => resource.update(id, data),
        remove: (id) => resource.deactivate(id),
    };
}
exports.industries = buildSimpleResourceService(repo.industries);
exports.functions = buildSimpleResourceService(repo.functions);
exports.skills = buildSimpleResourceService(repo.skills);
exports.languages = buildSimpleResourceService(repo.languages);
// ───────────── Locations ─────────────
const listLocations = () => repo.listLocations();
exports.listLocations = listLocations;
const listCities = () => repo.listCities();
exports.listCities = listCities;
const listLocalitiesByCity = (city) => repo.listLocalitiesByCity(city);
exports.listLocalitiesByCity = listLocalitiesByCity;
const createLocation = (state, city, locality) => repo.createLocation(state, city, locality);
exports.createLocation = createLocation;
const updateLocation = (id, data) => repo.updateLocation(id, data);
exports.updateLocation = updateLocation;
const deleteLocation = (id) => repo.deactivateLocation(id);
exports.deleteLocation = deleteLocation;
// ───────────── Job roles ─────────────
const listJobRoles = (functionId) => repo.listJobRoles(functionId);
exports.listJobRoles = listJobRoles;
const createJobRole = (name, functionId) => repo.createJobRole(name, functionId);
exports.createJobRole = createJobRole;
const updateJobRole = (id, data) => repo.updateJobRole(id, data);
exports.updateJobRole = updateJobRole;
const deleteJobRole = (id) => repo.deactivateJobRole(id);
exports.deleteJobRole = deleteJobRole;
// ───────────── Qualifications ─────────────
const listQualifications = () => repo.listQualifications();
exports.listQualifications = listQualifications;
const createQualification = (name, level) => repo.createQualification(name, level);
exports.createQualification = createQualification;
// NEW
const updateQualification = (id, data) => repo.updateQualification(id, data);
exports.updateQualification = updateQualification;
const deleteQualification = (id) => repo.deactivateQualification(id);
exports.deleteQualification = deleteQualification;
