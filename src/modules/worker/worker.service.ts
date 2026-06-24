import { WorkerRepository } from "./worker.repository";
import { BadRequestError, NotFoundError } from "../../common/errors";

const repo = new WorkerRepository();

// ───────────── Profile ─────────────
export const createProfile = async (userId: string) => {
  const existing = await repo.findByUserId(userId);
  if (existing) throw new BadRequestError("Profile already exists");
  return repo.createProfile(userId);
};

export const getOwnProfile = async (userId: string) => {
  const profile = await repo.findByUserIdFull(userId);
  if (!profile) throw new NotFoundError("Profile not found — create it first");
  return profile;
};

// Scalar fields only — the four array fields from the microservices
// version (skillIds, languageIds, preferredLocationIds,
// preferredIndustryIds) are now junction tables and go through the
// dedicated replace* repo methods below instead of a plain column update.
const SCALAR_FIELDS = [
  "name",
  "phone",
  "dob",
  "gender",
  "city",
  "currentLocality",
  "profilePhotoUrl",
  "headline",
  "summary",
  "totalExperienceMonths",
  "expectedSalaryMin",
  "expectedSalaryMax",
  "jobType",
  "availability",
  "resumeUrl",
];

export const updateProfile = async (
  userId: string,
  body: Record<string, any>,
) => {
  const profile = await repo.findByUserId(userId);
  if (!profile) throw new NotFoundError("Profile not found — create it first");

  const data: Record<string, any> = {};
  for (const key of SCALAR_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (data.dob) data.dob = new Date(data.dob);

  if (Object.keys(data).length) {
    await repo.updateProfile(userId, data);
  }

  if (body.skillIds) await repo.replaceSkills(profile.id, body.skillIds);
  // API contract note: languageIds (number[]) -> languages
  // ({ languageId, proficiency? }[]) — proficiency is a new optional field
  // on the junction table that didn't exist on the old Int[] column.
  if (body.languages) await repo.replaceLanguages(profile.id, body.languages);
  if (body.preferredLocationIds)
    await repo.replacePreferredLocations(profile.id, body.preferredLocationIds);
  if (body.preferredIndustryIds)
    await repo.replacePreferredIndustries(
      profile.id,
      body.preferredIndustryIds,
    );

  let updated = await repo.findByUserIdFull(userId);

  const isComplete = !!(
    updated!.name &&
    updated!.phone &&
    updated!.resumeUrl &&
    updated!.skills.length
  );
  if (isComplete !== updated!.profileComplete) {
    await repo.setProfileComplete(userId, isComplete);
    updated = await repo.findByUserIdFull(userId);
  }

  return updated;
};

// ───────────── Education ─────────────
export const addEducation = async (
  userId: string,
  qualificationId: number,
  institute?: string,
  passoutYear?: number,
  score?: string,
) => {
  const profile = await repo.findByUserId(userId);
  if (!profile) throw new NotFoundError("Profile not found — create it first");
  return repo.addEducation(profile.id, {
    qualificationId,
    institute,
    passoutYear,
    score,
  });
};

export const updateEducation = async (
  userId: string,
  educationId: string,
  data: any,
) => {
  const profile = await repo.findByUserId(userId);
  if (!profile) throw new NotFoundError("Profile not found");

  const education = await repo.findEducation(profile.id, educationId);
  if (!education) throw new NotFoundError("Education entry not found");

  return repo.updateEducation(educationId, data);
};

export const deleteEducation = async (userId: string, educationId: string) => {
  const profile = await repo.findByUserId(userId);
  if (!profile) throw new NotFoundError("Profile not found");

  const education = await repo.findEducation(profile.id, educationId);
  if (!education) throw new NotFoundError("Education entry not found");

  await repo.deleteEducation(educationId);
  return { deleted: true };
};

// ───────────── Experience ─────────────
export const addExperience = async (
  userId: string,
  companyName: string,
  jobTitle: string,
  fromDate: string,
  toDate?: string,
  isCurrent?: boolean,
  description?: string,
) => {
  const profile = await repo.findByUserId(userId);
  if (!profile) throw new NotFoundError("Profile not found — create it first");

  return repo.addExperience(profile.id, {
    companyName,
    jobTitle,
    fromDate: new Date(fromDate),
    toDate: toDate ? new Date(toDate) : undefined,
    isCurrent: !!isCurrent,
    description,
  });
};

export const updateExperience = async (
  userId: string,
  experienceId: string,
  data: any,
) => {
  const profile = await repo.findByUserId(userId);
  if (!profile) throw new NotFoundError("Profile not found");

  const experience = await repo.findExperience(profile.id, experienceId);
  if (!experience) throw new NotFoundError("Experience entry not found");

  if (data.fromDate) data.fromDate = new Date(data.fromDate);
  if (data.toDate) data.toDate = new Date(data.toDate);

  return repo.updateExperience(experienceId, data);
};

export const deleteExperience = async (
  userId: string,
  experienceId: string,
) => {
  const profile = await repo.findByUserId(userId);
  if (!profile) throw new NotFoundError("Profile not found");

  const experience = await repo.findExperience(profile.id, experienceId);
  if (!experience) throw new NotFoundError("Experience entry not found");

  await repo.deleteExperience(experienceId);
  return { deleted: true };
};

// ───────────── Recruiter/Admin-facing search ─────────────
// The microservices version explicitly punted on category-gating here:
// "needs the recruiter's assignedCategories from the JWT... we're not
// filtering by that yet — wire this in once Job Service exists and we can
// test the full flow together." Everything's in one DB now, so it's a
// plain join instead of a cross-service round trip. Implemented for real.
export const searchWorkers = async (
  currentUser: { id: string; role: string },
  filters: { skillId?: number; city?: string },
) => {
  const where: Record<string, any> = { profileComplete: true };
  if (filters.skillId) where.skills = { some: { skillId: filters.skillId } };
  if (filters.city) where.city = filters.city;

  if (currentUser.role === "recruiter") {
    const assigned = await repo.getRecruiterAssignedIndustryIds(currentUser.id);
    const industryIds = assigned.map((a) => a.industryId);
    // A recruiter with zero assigned categories sees zero workers, rather
    // than an unfiltered `in: []` which Prisma/Postgres would otherwise
    // treat as "match nothing" anyway — `-1` just makes that explicit.
    where.preferredIndustries = {
      some: { industryId: { in: industryIds.length ? industryIds : [-1] } },
    };
  }

  return repo.searchWorkers(where);
};

export const getWorkerById = async (id: string) => {
  const worker = await repo.findById(id);
  if (!worker) throw new NotFoundError("Worker not found");
  return worker;
};
