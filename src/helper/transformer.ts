
// Get the total count of documents based on the key given
export const getCount = (key: string) => (docs: any[]) => docs.reduce((acc, doc) => {
  const value = doc[key]
  if (!acc[value]) {
    acc[value] = 0
  }
  acc[value] += 1
  return acc
}, {})

// Get the total sum of all the arguments
export const sum = (...args: number[]): number => args.reduce((l, r) => l + r, 0)

// Take a given number of item from an array
export const take = (limit: number) => (...args: any[]) => args.slice(0, limit)

// Take only the value of a specific key from an array of object
export const pick = (key: string) => (...args: any[]) => args.map(arg => arg[key])

// Take an object and flatten it into array
export const objectToArray = (obj: any) => Object.keys(obj).map((key) => ({
  key,
  value: obj[key]
}))

// Takes a flattened list (1-dimensional) and convert it into and object
export const arrayToObject = (arr: any[]) => arr.reduce((acc, item) => {
  if (!acc[item]) {
    acc[item] = 0
  }
  acc[item] += 1
  return acc
}, {})

export const sortNumbers = (left: number, right: number) => {
  if (left > right) {
    return -1
  }
  if (left === right) {
    return 0
  }
  return 1
}

// Sort numbers in descending based on the key
export const sortNumberDescending = (key: string) => (a: any, b: any) => sortNumbers(a[key], b[key])
