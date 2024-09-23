import { Injectable } from '@angular/core';
import {AdriaApiService} from "../adria-api.service";
import {Observable, shareReplay, Subject, switchMap} from "rxjs";
import {ResultSetInfo} from "../../types/api.type";

@Injectable()
export class ResultSetService {
  get id(): string {
    if (this._id) {
      return this._id;
    } else {
      throw new Error("ResultSet id missing in context");
    }
  }

  set id(value: string) {
    if (this._id) {
      throw new Error("cannot change id once set");
    }
    this._id = value;
    this.id$.next(value);
    this.id$.complete();
  }

  private _id?: string;
  private id$ = new Subject<string>();

  info$: Observable<ResultSetInfo>;

  constructor(private api: AdriaApiService) {
    this.info$ = this.id$.pipe(
      switchMap(id => api.getResultSetInfo(id)),
      shareReplay(1)
    )
  }

}
