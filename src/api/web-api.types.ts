export type LoginResponse = {
  token: string;
  refreshToken: string;
};

/**
 * User properties encoded in the JWT token.
 */
export type UserPayload = {
  email: string;
  id: number;
  roles: Array<string>;
};

export type UserProfile = {
  user: UserPayload;
};

export type UserRole = 'ADMIN';

export type Polygon = any;

export type Note = any;

export interface User {
  id: number;
  email: string;
  roles: UserRole[];
}

export type UserAction = 'LOGIN' | 'LOGOUT' | 'CHANGE_PASSWORD' | 'UPDATED';

export interface UserLogs {
  logs: {
    id: number;
    userId: number;
    time: Date;
    action: UserAction;
    metadata: any;
    user: User;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// TODO:monorepo use types from webapi project

export type JobType = "TEST" | "SUITABILITY_ASSESSMENT" | "REGIONAL_ASSESSMENT";

export type CreateJobResponse = {
    jobId: number;
    cached: boolean;
    requestId: number;
}

export type JobDetailsResponse = {
    job: {
        type: JobType;
        status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "TIMED_OUT";
        id: number;
        created_at: Date;
        updated_at: Date;
        user_id: number;
        input_payload?: any;
    };
}

export type ListJobsResponse = {
    jobs: {
        status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "TIMED_OUT";
        type: JobType;
        id: number;
        created_at: Date;
        updated_at: Date;
        user_id: number;
        input_payload?: any;
    }[];
    total: number;
}

export type DownloadResponse = {
  job: {
    id: number;
    type: JobDetailsResponse["job"]["type"],
    status: JobDetailsResponse["job"]["status"]
  },
  files: Record<string, string>;
};

export type JobTypePayload_RegionalAssessment = {
  region: string;
  reef_type: 'slopes' | 'flats';
  depth_min: number;
  depth_max: number;
  slope_min: number;
  slope_max: number;
  rugosity_min: number;
  rugosity_max: number;
  waves_period_min: number;
  waves_period_max: number;
  waves_height_min: number;
  waves_height_max: number;
  // threshold not actually used by this job.
  threshold: number;
};

export type JobTypePayload_SuitabilityAssessment = {
  region: string;
  reef_type: 'slopes' | 'flats';
  depth_min: number;
  depth_max: number;
  slope_min: number;
  slope_max: number;
  rugosity_min: number;
  rugosity_max: number;
  waves_period_min: number;
  waves_period_max: number;
  waves_height_min: number;
  waves_height_max: number;
  // threshold not actually used by this job.
  threshold: number;
  x_dist: number;
  y_dist: number;
};
