
export type PointOrRange = number | [number, number];

export function pointOrRangeToParam(val: PointOrRange): string {
  if (typeof val === "number") {
    return `${val}`;
  } else {
    return `${val[0]}:${val[1]}`;
  }
}
