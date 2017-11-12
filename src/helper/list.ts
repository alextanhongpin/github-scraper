export function flatten(x: any[][]): any[] {
  return x.reduce((a, b) => a.concat(b), [])
}
