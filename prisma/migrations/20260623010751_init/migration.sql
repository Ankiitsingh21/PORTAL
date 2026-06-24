-- CreateEnum
CREATE TYPE "Role" AS ENUM ('super_admin', 'recruiter', 'worker');

-- CreateEnum
CREATE TYPE "WageType" AS ENUM ('daily', 'monthly');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('day', 'night', 'rotational');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('full_time', 'part_time', 'contract');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('draft', 'active', 'closed');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('applied', 'shortlisted', 'interview_scheduled', 'hired', 'rejected');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('immediate', 'within_15_days', 'within_30_days');

-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('basic', 'conversational', 'fluent');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recruiter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recruiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruiterCategory" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "industryId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobFunction" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "JobFunction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRole" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "functionId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "JobRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Qualification" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Qualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "city" TEXT,
    "currentLocality" TEXT,
    "profilePhotoUrl" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "totalExperienceMonths" INTEGER NOT NULL DEFAULT 0,
    "expectedSalaryMin" INTEGER,
    "expectedSalaryMax" INTEGER,
    "jobType" "JobType",
    "availability" "Availability",
    "resumeUrl" TEXT,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerEducation" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "qualificationId" INTEGER NOT NULL,
    "institute" TEXT,
    "passoutYear" INTEGER,
    "score" TEXT,

    CONSTRAINT "WorkerEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerExperience" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "WorkerExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerSkill" (
    "workerId" TEXT NOT NULL,
    "skillId" INTEGER NOT NULL,

    CONSTRAINT "WorkerSkill_pkey" PRIMARY KEY ("workerId","skillId")
);

-- CreateTable
CREATE TABLE "WorkerLanguage" (
    "workerId" TEXT NOT NULL,
    "languageId" INTEGER NOT NULL,
    "proficiency" "ProficiencyLevel",

    CONSTRAINT "WorkerLanguage_pkey" PRIMARY KEY ("workerId","languageId")
);

-- CreateTable
CREATE TABLE "WorkerPreferredLocation" (
    "workerId" TEXT NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "WorkerPreferredLocation_pkey" PRIMARY KEY ("workerId","locationId")
);

-- CreateTable
CREATE TABLE "WorkerPreferredIndustry" (
    "workerId" TEXT NOT NULL,
    "industryId" INTEGER NOT NULL,

    CONSTRAINT "WorkerPreferredIndustry_pkey" PRIMARY KEY ("workerId","industryId")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "industryId" INTEGER NOT NULL,
    "functionId" INTEGER,
    "jobRoleId" INTEGER,
    "locationId" INTEGER NOT NULL,
    "wageMin" INTEGER,
    "wageMax" INTEGER,
    "wageType" "WageType",
    "shiftType" "ShiftType",
    "jobType" "JobType",
    "headcountRequired" INTEGER NOT NULL,
    "headcountFilled" INTEGER NOT NULL DEFAULT 0,
    "minExperienceMonths" INTEGER NOT NULL DEFAULT 0,
    "status" "JobStatus" NOT NULL DEFAULT 'draft',
    "postedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSkill" (
    "jobId" TEXT NOT NULL,
    "skillId" INTEGER NOT NULL,

    CONSTRAINT "JobSkill_pkey" PRIMARY KEY ("jobId","skillId")
);

-- CreateTable
CREATE TABLE "JobQualification" (
    "jobId" TEXT NOT NULL,
    "qualificationId" INTEGER NOT NULL,

    CONSTRAINT "JobQualification_pkey" PRIMARY KEY ("jobId","qualificationId")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'applied',
    "coverNote" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "notes" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Recruiter_userId_key" ON "Recruiter"("userId");

-- CreateIndex
CREATE INDEX "Recruiter_createdById_idx" ON "Recruiter"("createdById");

-- CreateIndex
CREATE INDEX "RecruiterCategory_industryId_idx" ON "RecruiterCategory"("industryId");

-- CreateIndex
CREATE UNIQUE INDEX "RecruiterCategory_recruiterId_industryId_key" ON "RecruiterCategory"("recruiterId", "industryId");

-- CreateIndex
CREATE INDEX "Location_city_idx" ON "Location"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Location_state_city_locality_key" ON "Location"("state", "city", "locality");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_name_key" ON "Industry"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JobFunction_name_key" ON "JobFunction"("name");

-- CreateIndex
CREATE INDEX "JobRole_functionId_idx" ON "JobRole"("functionId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

-- CreateIndex
CREATE INDEX "WorkerEducation_workerId_idx" ON "WorkerEducation"("workerId");

-- CreateIndex
CREATE INDEX "WorkerEducation_qualificationId_idx" ON "WorkerEducation"("qualificationId");

-- CreateIndex
CREATE INDEX "WorkerExperience_workerId_idx" ON "WorkerExperience"("workerId");

-- CreateIndex
CREATE INDEX "WorkerSkill_skillId_idx" ON "WorkerSkill"("skillId");

-- CreateIndex
CREATE INDEX "WorkerLanguage_languageId_idx" ON "WorkerLanguage"("languageId");

-- CreateIndex
CREATE INDEX "WorkerPreferredLocation_locationId_idx" ON "WorkerPreferredLocation"("locationId");

-- CreateIndex
CREATE INDEX "WorkerPreferredIndustry_industryId_idx" ON "WorkerPreferredIndustry"("industryId");

-- CreateIndex
CREATE INDEX "Job_industryId_idx" ON "Job"("industryId");

-- CreateIndex
CREATE INDEX "Job_postedBy_idx" ON "Job"("postedBy");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_locationId_idx" ON "Job"("locationId");

-- CreateIndex
CREATE INDEX "Job_functionId_idx" ON "Job"("functionId");

-- CreateIndex
CREATE INDEX "Job_jobRoleId_idx" ON "Job"("jobRoleId");

-- CreateIndex
CREATE INDEX "JobSkill_skillId_idx" ON "JobSkill"("skillId");

-- CreateIndex
CREATE INDEX "JobQualification_qualificationId_idx" ON "JobQualification"("qualificationId");

-- CreateIndex
CREATE INDEX "Application_recruiterId_idx" ON "Application"("recruiterId");

-- CreateIndex
CREATE INDEX "Application_workerId_idx" ON "Application"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_workerId_key" ON "Application"("jobId", "workerId");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_idx" ON "ApplicationStatusHistory"("applicationId");

-- AddForeignKey
ALTER TABLE "Recruiter" ADD CONSTRAINT "Recruiter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruiter" ADD CONSTRAINT "Recruiter_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterCategory" ADD CONSTRAINT "RecruiterCategory_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterCategory" ADD CONSTRAINT "RecruiterCategory_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "JobFunction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerEducation" ADD CONSTRAINT "WorkerEducation_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerEducation" ADD CONSTRAINT "WorkerEducation_qualificationId_fkey" FOREIGN KEY ("qualificationId") REFERENCES "Qualification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerExperience" ADD CONSTRAINT "WorkerExperience_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerSkill" ADD CONSTRAINT "WorkerSkill_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerSkill" ADD CONSTRAINT "WorkerSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerLanguage" ADD CONSTRAINT "WorkerLanguage_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerLanguage" ADD CONSTRAINT "WorkerLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerPreferredLocation" ADD CONSTRAINT "WorkerPreferredLocation_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerPreferredLocation" ADD CONSTRAINT "WorkerPreferredLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerPreferredIndustry" ADD CONSTRAINT "WorkerPreferredIndustry_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerPreferredIndustry" ADD CONSTRAINT "WorkerPreferredIndustry_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "JobFunction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_postedBy_fkey" FOREIGN KEY ("postedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSkill" ADD CONSTRAINT "JobSkill_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSkill" ADD CONSTRAINT "JobSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobQualification" ADD CONSTRAINT "JobQualification_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobQualification" ADD CONSTRAINT "JobQualification_qualificationId_fkey" FOREIGN KEY ("qualificationId") REFERENCES "Qualification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
