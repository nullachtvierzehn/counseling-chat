export type MaybePromiseLike<T> = T | PromiseLike<T>

export type ActsAsPromiseLike<T> = T & PromiseLike<T>
