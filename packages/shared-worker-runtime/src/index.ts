export interface JobLimits {
  wallClockMs: number;
  maxUploadMb: number;
  maxFiles: number;
}

export const defaultJobLimits: JobLimits = {
  wallClockMs: 30_000,
  maxUploadMb: 25,
  maxFiles: 2,
};
