import { prisma } from "../../config/db";

type SimpleModel = "industry" | "jobFunction" | "skill" | "language";

function buildSimpleResourceRepo(modelName: SimpleModel) {
  const model = (prisma as any)[modelName];
  return {
    list: () => model.findMany({ where: { isActive: true } }),
    findByName: (name: string) => model.findUnique({ where: { name } }),
    create: (name: string) => model.create({ data: { name } }),
    update: (id: number, data: Partial<{ name: string; isActive: boolean }>) =>
      model.update({ where: { id }, data }),
    deactivate: (id: number) =>
      model.update({ where: { id }, data: { isActive: false } }),
  };
}

export class MasterDataRepository {
  industries = buildSimpleResourceRepo("industry");
  functions = buildSimpleResourceRepo("jobFunction");
  skills = buildSimpleResourceRepo("skill");
  languages = buildSimpleResourceRepo("language");

  // ───────────── Locations ─────────────
  listLocations() {
    return prisma.location.findMany({ where: { isActive: true } });
  }

  listCities() {
    return prisma.location
      .findMany({
        where: { isActive: true },
        select: { city: true },
        distinct: ["city"],
      })
      .then((rows) => rows.map((r) => r.city));
  }

  listLocalitiesByCity(city: string) {
    return prisma.location.findMany({ where: { city, isActive: true } });
  }

  createLocation(state: string, city: string, locality: string) {
    return prisma.location.create({ data: { state, city, locality } });
  }

  updateLocation(
    id: number,
    data: Partial<{
      state: string;
      city: string;
      locality: string;
      isActive: boolean;
    }>,
  ) {
    return prisma.location.update({ where: { id }, data });
  }

  deactivateLocation(id: number) {
    return prisma.location.update({ where: { id }, data: { isActive: false } });
  }

  // ───────────── Job roles (has functionId) ─────────────
  listJobRoles(functionId?: number) {
    return prisma.jobRole.findMany({
      where: { isActive: true, ...(functionId ? { functionId } : {}) },
    });
  }

  createJobRole(name: string, functionId?: number) {
    return prisma.jobRole.create({ data: { name, functionId } });
  }

  updateJobRole(
    id: number,
    data: Partial<{ name: string; functionId: number; isActive: boolean }>,
  ) {
    return prisma.jobRole.update({ where: { id }, data });
  }

  deactivateJobRole(id: number) {
    return prisma.jobRole.update({ where: { id }, data: { isActive: false } });
  }

  // ───────────── Qualifications (has level) ─────────────
  listQualifications() {
    return prisma.qualification.findMany({ where: { isActive: true } });
  }

  createQualification(name: string, level: string) {
    return prisma.qualification.create({ data: { name, level } });
  }
}
