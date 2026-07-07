/**
 * ════════════════════════════════════════════════════════════════════════
 *  SCN JOBS — FULL FLOW DEMO / TEST SCRIPT
 * ════════════════════════════════════════════════════════════════════════
 *
 *  What this does (in plain English):
 *    1. Logs in as the Super Admin (must already exist — see README below).
 *    2. Reads the master data already seeded in the DB (industries,
 *       locations, skills, qualifications, languages) and picks values
 *       to use for this run.
 *    3. Creates 10 RECRUITERS (Test Recruiter 1..10), each assigned to an
 *       industry, via the Admin API.
 *    4. Logs in as each recruiter and has them each POST one job opening
 *       (so we end up with 10 live job postings), then publishes
 *       (activates) each job.
 *    5. Creates 10 WORKERS (Test Worker 1..10) via the public registration
 *       endpoint, runs them through the OTP verification flow (using the
 *       OTP that the server itself returns in non-production mode), logs
 *       each one in, and builds out a full profile for each one
 *       (personal details, one education entry, one experience entry,
 *       skills, languages, preferred location/industry).
 *    6. Has every worker apply to a job (Worker N applies to Job N, so it's
 *       easy to follow on screen), then walks each application through the
 *       full hiring pipeline: applied → shortlisted → interview_scheduled
 *       → hired (8 of them) / rejected (2 of them), to demonstrate both
 *       outcomes.
 *    7. Has a recruiter try (and fail) to view another recruiter's job
 *       applicants, and a worker try (and fail) to view another worker's
 *       application — to demonstrate that access control is working.
 *    8. Prints a clean, numbered, colour-coded summary of every single
 *       step as it happens, plus a final summary table — this is the part
 *       you can literally screen-share with the client.
 *
 *  Nothing here touches real SMS/Email — OTP is read directly from the
 *  API's own "devOtp" field, which the server only returns outside of
 *  production. This script therefore exercises the *entire* OTP
 *  verify flow (store → verify → clear) without needing a live SMS/Email
 *  provider connected.
 *
 *  HOW TO RUN — see the README block at the very bottom of this file,
 *  or the separate run instructions you were given alongside this file.
 * ════════════════════════════════════════════════════════════════════════
 */

const axios = require("axios");

// ─────────────────────────── Configuration ───────────────────────────

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000/api";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const WORKER_COUNT = Number(process.env.TEST_WORKER_COUNT || 10);
const RECRUITER_COUNT = Number(process.env.TEST_RECRUITER_COUNT || 10);
// Use a fresh run id so re-running the script never collides with a
// previous run's emails/phones (Postgres has unique constraints on both).
const RUN_ID = Date.now().toString().slice(-6);

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "\n✖ Missing ADMIN_EMAIL / ADMIN_PASSWORD environment variables.\n" +
      "  These must match whatever you used when you ran `npm run seed:admin`.\n" +
      "  Example: ADMIN_EMAIL=admin@scnjobs.com ADMIN_PASSWORD=Admin@123 node test-full-flow.js\n",
  );
  process.exit(1);
}

// ─────────────────────────── Tiny console UI helpers ───────────────────────────

const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m", gray: "\x1b[90m",
};

let stepCounter = 0;
const results = []; // { step, label, status: 'PASS'|'FAIL', detail }

function section(title) {
  console.log(`\n${c.bold}${c.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.log(`${c.bold}${c.cyan}  ${title}${c.reset}`);
  console.log(`${c.bold}${c.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}\n`);
}

function pass(label, detail = "") {
  stepCounter++;
  console.log(`${c.green}${c.bold}✔ [${stepCounter}] PASS${c.reset}  ${label}${detail ? c.gray + "  — " + detail + c.reset : ""}`);
  results.push({ step: stepCounter, label, status: "PASS", detail });
}

function fail(label, detail = "") {
  stepCounter++;
  console.log(`${c.red}${c.bold}✘ [${stepCounter}] FAIL${c.reset}  ${label}${detail ? c.gray + "  — " + detail + c.reset : ""}`);
  results.push({ step: stepCounter, label, status: "FAIL", detail });
}

function info(label) {
  console.log(`${c.blue}  ℹ ${label}${c.reset}`);
}

function moneyShot(label) {
  console.log(`${c.magenta}${c.bold}\n  ★ ${label}${c.reset}`);
}

// A small wrapper that runs a step, records pass/fail, and never throws —
// so one failed call doesn't crash the whole demo run.
async function step(label, fn, { expectFail = false } = {}) {
  try {
    const result = await fn();
    if (expectFail) {
      fail(label, "Expected this call to be rejected, but it succeeded");
      return result;
    }
    pass(label);
    return result;
  } catch (err) {
    const apiMessage =
      err.response?.data?.message ||
      (err.response?.data?.errors && JSON.stringify(err.response.data.errors)) ||
      err.message;
    if (expectFail) {
      pass(label, `Correctly rejected — server said: "${apiMessage}"`);
    } else {
      fail(label, `HTTP ${err.response?.status || "?"} — ${apiMessage}`);
    }
    return null;
  }
}

// ─────────────────────────── Session-aware HTTP client ───────────────────────────
//
// The API uses a cookie-based session (cookie-session), not a bearer
// token header. axios in Node does not behave like a browser and will
// not automatically store/replay cookies, so we do it ourselves: every
// "actor" (admin / one recruiter / one worker) gets its own client that
// remembers whatever Set-Cookie header the server sent back on login and
// re-attaches it to every later request.

function makeClient(name) {
  const instance = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true, // we inspect status codes ourselves
  });

  let cookie = null;

  instance.interceptors.request.use((cfg) => {
    if (cookie) cfg.headers.Cookie = cookie;
    return cfg;
  });

  instance.interceptors.response.use((res) => {
    const setCookie = res.headers["set-cookie"];
    if (setCookie && setCookie.length) {
      // cookie-session sends one cookie named "session" (+ maybe "session.sig")
      cookie = setCookie.map((sc) => sc.split(";")[0]).join("; ");
    }
    // Treat 4xx/5xx as throwable errors so our step() wrapper can catch them,
    // same as axios's default behaviour, since we disabled it above.
    if (res.status >= 400) {
      const err = new Error(res.data?.message || `HTTP ${res.status}`);
      err.response = res;
      throw err;
    }
    return res;
  });

  instance.actorName = name;
  return instance;
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  const startedAt = Date.now();

  console.log(`${c.bold}\nSCN JOBS — FULL FLOW DEMO${c.reset}`);
  console.log(`${c.gray}Target server: ${BASE_URL}${c.reset}`);
  console.log(`${c.gray}Run ID: ${RUN_ID}  (keeps this run's test data unique)${c.reset}`);
  console.log(`${c.gray}Workers: ${WORKER_COUNT}   Recruiters: ${RECRUITER_COUNT}${c.reset}`);

  // ───────────────────────── 0. Health check ─────────────────────────
  section("STEP 0 — Server health check");
  await step("Server is up and responding", async () => {
    const res = await axios.get(BASE_URL.replace(/\/api$/, "") + "/api/health");
    if (res.status !== 200) throw new Error("Health check did not return 200");
  });

  // ───────────────────────── 1. Admin login ─────────────────────────
  section("STEP 1 — Super Admin logs in");
  const admin = makeClient("Super Admin");
  await step("Super Admin logs in with email + password", async () => {
    const res = await admin.post("/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    if (!res.data?.success) throw new Error("Login did not return success:true");
  });
  await step("GET /auth/me confirms the logged-in identity", async () => {
    const res = await admin.get("/auth/me");
    if (res.data?.data?.role !== "super_admin") throw new Error("Role mismatch");
  });

  // ───────────────────────── 2. Read master data ─────────────────────────
  section("STEP 2 — Reading master / reference data (already seeded in the DB)");

  let industries = [], locations = [], skills = [], qualifications = [], languages = [];

  await step("Fetch industries", async () => {
    const res = await admin.get("/master/industries");
    industries = res.data.data.filter((i) => i.isActive !== false);
    if (industries.length === 0) throw new Error("No industries found — run `npm run seed:master` first");
  });
  await step("Fetch locations", async () => {
    const res = await admin.get("/master/locations");
    locations = res.data.data.filter((l) => l.isActive !== false);
    if (locations.length === 0) throw new Error("No locations found — run `npm run seed:master` first");
  });
  await step("Fetch skills", async () => {
    const res = await admin.get("/master/skills");
    skills = res.data.data.filter((s) => s.isActive !== false);
    if (skills.length === 0) throw new Error("No skills found — run `npm run seed:master` first");
  });
  await step("Fetch qualifications", async () => {
    const res = await admin.get("/master/qualifications");
    qualifications = res.data.data;
    if (qualifications.length === 0) throw new Error("No qualifications found — run `npm run seed:master` first");
  });
  await step("Fetch languages", async () => {
    const res = await admin.get("/master/languages");
    languages = res.data.data.filter((l) => l.isActive !== false);
    if (languages.length === 0) throw new Error("No languages found — run `npm run seed:master` first");
  });

  info(`Using industry pool of ${industries.length}, ${locations.length} locations, ${skills.length} skills, ${qualifications.length} qualifications, ${languages.length} languages`);

  // We need at least RECRUITER_COUNT industries to give every recruiter a
  // distinct one, but it's fine to wrap around if the seeded list is shorter.
  const pick = (arr, i) => arr[i % arr.length];

  // ───────────────────────── 3. Create recruiters ─────────────────────────
  section(`STEP 3 — Super Admin onboards ${RECRUITER_COUNT} recruiters`);

  const recruiters = []; // { index, name, email, password, client, userId, recruiterId, industryId, industryName, jobId }

  for (let i = 1; i <= RECRUITER_COUNT; i++) {
    const industry = pick(industries, i - 1);
    const name = `Test Recruiter ${i}`;
    const email = `test.recruiter${i}.${RUN_ID}@scnjobs-demo.com`;
    const password = "Recruiter@123";

    const created = await step(
      `Create recruiter "${name}" → assigned industry "${industry.name}"`,
      async () => {
        const res = await admin.post("/admin/recruiters", {
          name, email, password, industryIds: [industry.id],
        });
        return res.data.data;
      },
    );

    if (created) {
      recruiters.push({
        index: i, name, email, password,
        userId: created.userId || created.id,
        recruiterId: created.id,
        industryId: industry.id,
        industryName: industry.name,
      });
    }
  }

  // ───────────────────────── 4. Recruiters log in & post jobs ─────────────────────────
  section(`STEP 4 — Each recruiter logs in and posts one job opening`);

  for (const r of recruiters) {
    r.client = makeClient(r.name);

    await step(`${r.name} logs in`, async () => {
      const res = await r.client.post("/auth/login", { email: r.email, password: r.password });
      if (!res.data?.success) throw new Error("Login failed");
    });

    const location = pick(locations, r.index - 1);
    const jobTitle = `${r.industryName} Worker — Opening ${r.index}`;

    const job = await step(`${r.name} posts a job: "${jobTitle}" (status: draft)`, async () => {
      const res = await r.client.post("/jobs", {
        title: jobTitle,
        description: `Demo job posting #${r.index} created for the ${r.industryName} industry, based in ${location.city}.`,
        industryId: r.industryId,
        locationId: location.id,
        headcountRequired: 2,
        minExperienceMonths: 0,
        wageType: "monthly",
        wageMin: 12000,
        wageMax: 18000,
        shiftType: "day",
        jobType: "full_time",
        skillIds: [pick(skills, r.index - 1).id],
      });
      return res.data.data;
    });

    if (job) {
      r.jobId = job.id;
      await step(`${r.name} publishes the job (draft → active)`, async () => {
        const res = await r.client.patch(`/jobs/${job.id}/status`, { status: "active" });
        if (res.data.data.status !== "active") throw new Error("Status did not change to active");
      });
    }
  }

  moneyShot(`${recruiters.filter((r) => r.jobId).length} job postings are now LIVE on the platform`);

  // ───────────────────────── 5. Workers register, verify OTP, build profile ─────────────────────────
  section(`STEP 5 — ${WORKER_COUNT} workers register, verify their phone via OTP, and build their profile`);

  const workers = []; // { index, name, email, phone, password, client, userId, profileId, applicationId }

  for (let i = 1; i <= WORKER_COUNT; i++) {
    const name = `Test Worker ${i}`;
    const email = `test.worker${i}.${RUN_ID}@scnjobs-demo.com`;
    // Keep phone numbers unique and within the 10–15 char rule.
    // "9" (1) + RUN_ID (6) + index padded to 3 digits = 10 characters total,
    // which satisfies the isLength({ min: 10, max: 15 }) validator.
    const phone = `9${RUN_ID}${String(i).padStart(3, "0")}`;
    const password = "Worker@123";

    const client = makeClient(name);
    let devOtp = null;

    const reg = await step(`${name} registers (email: ${email}, phone: ${phone})`, async () => {
      const res = await client.post("/auth/worker/register", { email, password, phone });
      return res.data.data;
    });
    if (!reg) continue;
    devOtp = reg.devOtp;

    info(`Server generated OTP "${devOtp}" for ${name} and stored it in Redis (5-minute expiry) — SMS/Email sending itself is switched off for this test phase, exactly as configured`);

    await step(`${name} verifies their phone using the OTP (${devOtp})`, async () => {
      const res = await client.post("/auth/worker/verify-otp", { phone, otp: devOtp });
      if (!res.data?.success) throw new Error("OTP verification failed");
    });

    await step(`${name} logs in with email + password (now that phone is verified)`, async () => {
      const res = await client.post("/auth/login", { email, password });
      if (!res.data?.success) throw new Error("Login failed");
    });

    // Profile is created automatically on registration
    const location = pick(locations, i - 1);
    const industry = pick(industries, i - 1);
    const qualification = pick(qualifications, i - 1);
    const language = pick(languages, i - 1);
    const skill = pick(skills, i - 1);

    await step(`${name} fills out their profile (personal details, skills, languages, preferences)`, async () => {
      await client.patch("/worker/profile", {
        name,
        phone,
        city: location.city,
        currentLocality: location.locality,
        headline: `${industry.name} worker, eager to join immediately`,
        summary: `Demo profile #${i} generated for client showcase.`,
        totalExperienceMonths: 12 + i,
        expectedSalaryMin: 12000,
        expectedSalaryMax: 18000,
        jobType: "full_time",
        availability: "immediate",
        resumeUrl: `https://example.com/demo-resumes/worker-${i}.pdf`,
        skillIds: [skill.id],
        languages: [{ languageId: language.id, proficiency: "fluent" }],
        preferredLocationIds: [location.id],
        preferredIndustryIds: [industry.id],
      });
    });

    await step(`${name} adds one education entry`, async () => {
      await client.post("/worker/education", {
        qualificationId: qualification.id,
        institute: `Demo Institute of Technology ${i}`,
        passoutYear: 2018 + (i % 5),
        score: "72%",
      });
    });

    await step(`${name} adds one work-experience entry`, async () => {
      await client.post("/worker/experience", {
        companyName: `Previous Employer ${i} Pvt Ltd`,
        jobTitle: `${industry.name} Associate`,
        fromDate: "2021-01-01",
        toDate: "2023-12-31",
        isCurrent: false,
        description: "Handled daily operational tasks and met all targets.",
      });
    });

    const profile = await step(`${name}'s profile is fetched back and confirmed complete`, async () => {
      const res = await client.get("/worker/profile");
      if (!res.data.data.profileComplete) throw new Error("Profile did not reach profileComplete:true");
      return res.data.data;
    });

    workers.push({ index: i, name, email, phone, client, profileId: profile?.id });
  }

  moneyShot(`${workers.length} worker profiles are now fully built and ready to apply`);

  // ───────────────────────── 6. Applications + hiring pipeline ─────────────────────────
  section("STEP 6 — Workers apply, recruiters review, applications move through the hiring pipeline");

  // Pair Worker N with Recruiter N's job (wrapping if counts differ) so it's
  // easy to follow on screen.
  for (const worker of workers) {
    const recruiter = pick(recruiters.filter((r) => r.jobId), worker.index - 1);
    if (!recruiter) continue;

    const application = await step(
      `${worker.name} applies to "${recruiter.industryName} Worker — Opening ${recruiter.index}" (posted by ${recruiter.name})`,
      async () => {
        const res = await worker.client.post("/applications", {
          jobId: recruiter.jobId,
          coverNote: `I am very interested in this ${recruiter.industryName} role and can join immediately.`,
        });
        return res.data.data;
      },
    );
    if (!application) continue;
    worker.applicationId = application.id;
    worker.recruiter = recruiter;

    await step(`${worker.name} sees this application under "My Applications"`, async () => {
      const res = await worker.client.get("/applications/my");
      const found = res.data.data.find((a) => a.id === application.id);
      if (!found) throw new Error("Application not found in worker's own list");
    });

    await step(`${recruiter.name} sees ${worker.name} in their applicant list for this job`, async () => {
      const res = await recruiter.client.get(`/applications/job/${recruiter.jobId}`);
      const found = res.data.data.find((a) => a.id === application.id);
      if (!found) throw new Error("Applicant not visible to the owning recruiter");
    });

    await step(`${recruiter.name} shortlists ${worker.name} (applied → shortlisted)`, async () => {
      const res = await recruiter.client.patch(`/applications/${application.id}/status`, {
        status: "shortlisted",
        notes: "Good fit on paper, moving to interview stage.",
      });
      if (res.data.data.status !== "shortlisted") throw new Error("Status mismatch");
    });

    await step(`${recruiter.name} schedules an interview for ${worker.name} (shortlisted → interview_scheduled)`, async () => {
      const res = await recruiter.client.patch(`/applications/${application.id}/status`, {
        status: "interview_scheduled",
        notes: "Interview scheduled for next week.",
      });
      if (res.data.data.status !== "interview_scheduled") throw new Error("Status mismatch");
    });

    // Hire 8 out of 10, reject the last 2 — so the demo shows both outcomes.
    const finalStatus = worker.index > workers.length - 2 ? "rejected" : "hired";
    await step(
      `${recruiter.name} marks ${worker.name} as "${finalStatus}" (interview_scheduled → ${finalStatus})`,
      async () => {
        const res = await recruiter.client.patch(`/applications/${application.id}/status`, {
          status: finalStatus,
          notes: finalStatus === "hired" ? "Offer extended and accepted." : "Did not meet final requirements.",
        });
        if (res.data.data.status !== finalStatus) throw new Error("Status mismatch");
      },
    );
    worker.finalStatus = finalStatus;
  }

  const hiredCount = workers.filter((w) => w.finalStatus === "hired").length;
  const rejectedCount = workers.filter((w) => w.finalStatus === "rejected").length;
  moneyShot(`Hiring pipeline complete — ${hiredCount} hired, ${rejectedCount} rejected, all the way from "applied" to a final decision`);

  // ───────────────────────── 7. Negative tests — access control ─────────────────────────
  section("STEP 7 — Confirming access control (these calls are SUPPOSED to fail)");

  if (recruiters.length >= 2 && recruiters[0].jobId) {
    await step(
      `${recruiters[1].name} tries to view applicants for ${recruiters[0].name}'s job (should be blocked)`,
      async () => {
        await recruiters[1].client.get(`/applications/job/${recruiters[0].jobId}`);
      },
      { expectFail: true },
    );
  }

  if (workers.length >= 2 && workers[0].applicationId) {
    await step(
      `${workers[1].name} tries to view ${workers[0].name}'s application by ID (should be blocked)`,
      async () => {
        await workers[1].client.get(`/applications/${workers[0].applicationId}`);
      },
      { expectFail: true },
    );
  }

  await step("An unauthenticated request to /auth/me is rejected", async () => {
    const res = await axios.get(`${BASE_URL}/auth/me`, { validateStatus: () => true });
    if (res.status !== 401) {
      const err = new Error(`Expected 401, got ${res.status}`);
      err.response = res;
      throw err;
    }
  });

  if (workers[0]?.applicationId) {
    await step(
      `${workers[0].name} tries to withdraw an application that's already past "applied" (should be blocked)`,
      async () => {
        await workers[0].client.delete(`/applications/${workers[0].applicationId}`);
      },
      { expectFail: true },
    );
  }

  // ───────────────────────── Final summary ─────────────────────────
  section("FINAL SUMMARY");

  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const durationSec = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log(`${c.bold}Total steps run:${c.reset}   ${results.length}`);
  console.log(`${c.green}${c.bold}Passed:${c.reset}          ${passCount}`);
  console.log(`${c.red}${c.bold}Failed:${c.reset}          ${failCount}`);
  console.log(`${c.bold}Time taken:${c.reset}       ${durationSec}s`);

  console.log(`\n${c.bold}Data created in this run:${c.reset}`);
  console.log(`  • ${recruiters.length} recruiters, ${recruiters.filter((r) => r.jobId).length} jobs posted & activated`);
  console.log(`  • ${workers.length} workers, all with complete profiles`);
  console.log(`  • ${workers.filter((w) => w.applicationId).length} applications submitted and carried through to a final decision`);
  console.log(`  • Final outcomes: ${hiredCount} hired, ${rejectedCount} rejected`);

  if (failCount > 0) {
    console.log(`\n${c.red}${c.bold}Steps that failed:${c.reset}`);
    results.filter((r) => r.status === "FAIL").forEach((r) => {
      console.log(`  ${c.red}✘ [${r.step}] ${r.label} — ${r.detail}${c.reset}`);
    });
  }

  console.log(
    `\n${c.bold}${failCount === 0 ? c.green : c.red}${
      failCount === 0
        ? "✔ ALL STEPS PASSED — the full worker + recruiter + admin + hiring flow works end-to-end."
        : "✘ SOME STEPS FAILED — see the list above."
    }${c.reset}\n`,
  );

  process.exit(failCount === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(`\n${c.red}${c.bold}Unexpected error — the script crashed:${c.reset}`, err);
  process.exit(1);
});