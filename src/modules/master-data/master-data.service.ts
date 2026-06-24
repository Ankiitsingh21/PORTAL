import { MasterDataRepository } from "./master-data.repository";
import { BadRequestError } from "../../common/errors";

const repo = new MasterDataRepository();

type SimpleResourceRepo = typeof repo.industries;

function buildSimpleResourceService(resource: SimpleResourceRepo) {
  return {
    list: () => resource.list(),
    create: async (name: string) => {
      const existing = await resource.findByName(name);
      if (existing) throw new BadRequestError(`${name} already exists`);
      return resource.create(name);
    },
    update: (id: number, data: any) => resource.update(id, data),
    remove: (id: number) => resource.deactivate(id),
  };
}

export const industries = buildSimpleResourceService(repo.industries);
export const functions = buildSimpleResourceService(repo.functions);
export const skills = buildSimpleResourceService(repo.skills);
export const languages = buildSimpleResourceService(repo.languages);

// ───────────── Locations ─────────────
export const listLocations = () => repo.listLocations();
export const listCities = () => repo.listCities();
export const listLocalitiesByCity = (city: string) => repo.listLocalitiesByCity(city);
export const createLocation = (state: string, city: string, locality: string) =>
  repo.createLocation(state, city, locality);
export const updateLocation = (id: number, data: any) => repo.updateLocation(id, data);
export const deleteLocation = (id: number) => repo.deactivateLocation(id);

// ───────────── Job roles ─────────────
export const listJobRoles = (functionId?: number) => repo.listJobRoles(functionId);
export const createJobRole = (name: string, functionId?: number) => repo.createJobRole(name, functionId);
export const updateJobRole = (id: number, data: any) => repo.updateJobRole(id, data);
export const deleteJobRole = (id: number) => repo.deactivateJobRole(id);

// ───────────── Qualifications ─────────────
export const listQualifications = () => repo.listQualifications();
export const createQualification = (name: string, level: string) => repo.createQualification(name, level);
