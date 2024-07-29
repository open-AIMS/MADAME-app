import { Injectable } from '@angular/core';

@Injectable()
export class ResultSetService {

  public id?: string;

  constructor() { }

  getId(): string {
    if (this.id) {
      return this.id;
    } else {
      throw new Error("ResultSet id missing in context");
    }
  }
}
