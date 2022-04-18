export interface Options {
  host?: string
}

// TODO: Implement module
export default (name: string, options?: Options): string => {
  if (typeof name !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof name}`)
  }

  options = Object.assign({}, options)

  return `${name}@${options.host ?? 'zce.me'}`
}
