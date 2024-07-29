import { U } from '@angular/cdk/keycodes';
import { DataFrame } from '../types/api.type';


/**
 * Convert the dataframe to row objects.
 */
export function dataframeToRowObjects(data: DataFrame | null | undefined, indexes?: Array<number>): Array<any> {
  if (data == null || data.columns.length === 0) {
    return [];
  }

  const rows: Array<Record<string, any>> = [];
  const { columns, colindex } = data;
  const { lookup, names } = colindex;
  const numRows = data.columns[0].length;

  if (indexes !== undefined) {
    for (let i of indexes) {
      const row: Record<string, any> = {};
      for (let colname of names) {
        row[colname] = columns[lookup[colname]][i];
      }
      rows.push(row);
    }
  } else {
    for (let i = 0; i < numRows; i++) {
      const row: Record<string, any> = {};
      for (let colname of names) {
        row[colname] = columns[lookup[colname]][i];
      }
      rows.push(row);
    }
  }

  return rows;
}

export interface SimpleTable<T = any> {
  rows: Array<T>;
  columns: Array<string>;
}

export function dataframeToTable(data: DataFrame): SimpleTable {
  if (data == null) {
    return { rows: [], columns: [] };
  }

  return {
    rows: dataframeToRowObjects(data),
    // all columns
    columns: data.colindex.names
  }
}

export function dataframeFind(data: DataFrame, colname: string, fn: (val: any) => boolean, returnColname: string): any | undefined {
  const { columns, colindex } = data;
  const { lookup, names } = colindex;

  const col = columns[lookup[colname]];
  if (col === undefined) {
    throw new Error(`column "${colname}" does not exist in DataFrame`);
  }

  const index = col.findIndex(fn);
  if (index === -1) {
    return undefined;
  }

  const returnCol = columns[lookup[returnColname]];
  if (returnCol === undefined) {
    throw new Error(`column "${returnColname}" does not exist in DataFrame`);
  }

  return returnCol[index];
}
