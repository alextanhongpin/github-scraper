export const flatten = (x: any[][]): any[] => x.reduce((a, b) => a.concat(b), [])
