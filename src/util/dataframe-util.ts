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
        // lookup values are 1-based index
        row[colname] = columns[lookup[colname] - 1][i];
      }
      rows.push(row);
    }
  } else {
    for (let i = 0; i < numRows; i++) {
      const row: Record<string, any> = {};
      for (let colname of names) {
        // lookup values are 1-based index
        row[colname] = columns[lookup[colname] - 1][i];
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
