export interface UserPayload {
  id: string;
  role: "super_admin" | "recruiter" | "worker";
}

// No more `assignedCategories` baked into the JWT. In the microservices
// version a recruiter's categories were stamped into the token at login,
// so admin changing them didn't take effect until the recruiter logged in
// again. In the monolith, every place that needs to check a recruiter's
// categories (job.middlewares.categoryGuard, worker.service.searchWorkers)
// just queries RecruiterCategory live — same DB, one join, always current.
declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}
