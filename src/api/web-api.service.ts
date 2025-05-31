import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import {
  CreateJobResponse,
  DownloadResponse,
  JobDetailsResponse,
  JobType,
  ListJobsResponse,
  LoginResponse,
  Note,
  Polygon,
  User,
  UserLogs,
  UserProfile,
  UserRole,
} from './web-api.types';
import {
  interval,
  map,
  Observable,
  switchMap,
  distinctUntilKeyChanged,
  takeWhile,
  tap
} from 'rxjs';

type JobId = CreateJobResponse['jobId'];

/**
 * MADAME/ReefGuide Web API - see https://github.com/open-AIMS/reefguide-web-api
 *
 * This service provides authentication endpoints, which is used by AuthService.
 *
 * It also provides admin endpoints for controlling clusters and managing users.
 */
@Injectable({
  providedIn: 'root',
})
export class WebApiService {
  private readonly http = inject(HttpClient);
  base = environment.webApiUrl;
  baseUsers = `${environment.webApiUrl}/users`;

  constructor() {}

  register(user: { email: string; password: string }) {
    return this.http.post<{ userId: number }>(
      `${this.base}/auth/register`,
      user
    );
  }

  login(user: { email: string; password: string }) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, user);
  }

  refreshToken(refreshToken: string): Observable<string> {
    return this.http
      .post<{ token: string }>(`${this.base}/auth/token`, { refreshToken })
      .pipe(map(resp => resp.token));
  }

  getProfile() {
    return this.http.get<UserProfile>(`${this.base}/auth/profile`);
  }

  getPolygons(): Observable<Polygon[]> {
    return this.http.get<Polygon[]>(`${this.base}/polygons`);
  }

  getPolygon(id: string): Observable<Polygon> {
    return this.http.get<Polygon>(`${this.base}/polygons/${id}`);
  }

  // TODO fix types where using any
  createPolygon(geoJSON: any): Observable<any> {
    return this.http.post<any>(`${this.base}/polygons`, geoJSON);
  }

  updatePolygon(id: string, geoJSON: any): Observable<void> {
    return this.http.put<any>(`${this.base}/polygons/${id}`, geoJSON);
  }

  deletePolygon(id: string) {
    return this.http.delete(`${this.base}/polygons/${id}`);
  }

  // TODO remaining note endpoints, types
  getNotes(): Observable<Array<Note>> {
    return this.http.get<Array<Note>>(`${this.base}/notes`);
  }

  getNote(id: string): Observable<Note> {
    return this.http.get<Note>(`${this.base}/notes/${id}`);
  }

  createNote(polygonId: number, content: string) {
    return this.http.post(`${this.base}/notes`, {
      polygonId,
      content,
    });
  }

  updateNote(id: string, content: string) {
    return this.http.put(`${this.base}/notes/${id}`, { content });
  }

  getClusterStatus() {
    return this.http.get<any>(`${this.base}/admin/status`);
  }

  scaleCluster(desiredCount: number) {
    return this.http.post(`${this.base}/admin/scale`, { desiredCount });
  }

  redeployCluster() {
    return this.http.post(`${this.base}/admin/redeploy`, {});
  }

  getUsers() {
    return this.http.get<User[]>(this.baseUsers);
  }

  getUser(id: number) {
    return this.http.get<User>(`${this.baseUsers}/${id}`);
  }

  createUser(userData: { email: string; password: string; roles: UserRole[] }) {
    return this.http.post<{ id: number }>(this.baseUsers, userData);
  }

  updateUserRoles(userId: number, roles: UserRole[]) {
    return this.http.put<User>(`${this.baseUsers}/${userId}/roles`, { roles });
  }

  updatePassword(userId: number, password: string) {
    return this.http.put(`${this.baseUsers}/${userId}/password`, { password });
  }

  deleteUser(userId: number) {
    return this.http.delete(`${this.baseUsers}/${userId}`);
  }

  userLogs({ page, limit }: { page: number; limit: number }) {
    return this.http.get<UserLogs>(
      `${this.baseUsers}/utils/log?page=${page}&limit=${limit}`
    );
  }

  // ## Jobs System ##

  createJob(
    type: string,
    payload: Record<string, any>
  ): Observable<CreateJobResponse> {
    return this.http.post<CreateJobResponse>(`${this.base}/jobs`, {
      type,
      inputPayload: payload,
    });
  }

  getJob(jobId: JobId): Observable<JobDetailsResponse> {
    return this.http.get<JobDetailsResponse>(`${this.base}/jobs/${jobId}`);
  }

  downloadJobResults(
    jobId: JobId,
    expirySeconds?: number
  ): Observable<DownloadResponse> {
    return this.http.get<DownloadResponse>(
      `${this.base}/jobs/${jobId}/download`,
      {
        params: expirySeconds !== undefined ? { expirySeconds } : undefined,
      }
    );
  }

  // TODO API supports status filter
  listJobs(): Observable<ListJobsResponse> {
    return this.http.get<ListJobsResponse>(`${this.base}/jobs`);
  }

  // ## Jobs System: high-level API ##

  /**
   * Create a job and return Observable that emits job details when status changes.
   * Completes when status changes from pending/in-progress.
   * @param jobType job type
   * @param payload job type's payload
   * @param period how often to request job status in milliseconds (default 2 seconds)
   * @returns Observable of job details job sub property
   */
  startJob(
    jobType: JobType,
    payload: Record<string, any>,
    period = 2_000
  ): Observable<JobDetailsResponse['job']> {
    return this.createJob(jobType, payload).pipe(
      switchMap(createJobResp => {
        const jobId = createJobResp.jobId;
        return interval(period).pipe(
          // Future: if client is tracking many jobs, it would be more efficient to
          // share the query/request for all of them (i.e. switchMap to shared observable),
          // but this is simplest for now.
          switchMap(() => this.getJob(jobId)),
          // discard extra wrapping object, which has no information.
          map(v => v.job),
          // only emit when job status changes.
          distinctUntilKeyChanged('status'),
          // complete observable when not pending/in-progress; emit the last value
          takeWhile(
            x => x.status === 'PENDING' || x.status === 'IN_PROGRESS',
            true // inclusive: emit the first value that fails the predicate
          ),
          // convert job error statuses to thrown errors.
          tap(job => {
            const s = job.status;
            if (s === 'FAILED' || s === 'CANCELLED' || s === 'TIMED_OUT') {
              throw new Error(`Job id=${job.id} ${s}`);
            }
            return job;
          })
        );
      })
    );
  }
}
