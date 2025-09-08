// eslint-disable-next-line
export const ENV = (import.meta.env.VITE_ENV as 'prod' | 'test') ?? 'test'
console.info('ENV', import.meta.env.VITE_ENV)
export const isProd = ENV == 'prod'
export const isTest = ENV == 'test'
