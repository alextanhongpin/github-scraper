export function generatePages (totalCount: number, perPage: number): number[] {
  const pages = Math.ceil(totalCount / perPage)
  return Array(pages).fill(0).map((_, page) => page + 1)
}