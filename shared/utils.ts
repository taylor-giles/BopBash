/**
 * A type which has the same keys as type T with values of type U
 */
export type TransformKeys<T,U> = {
    [K in keyof T]: U;
}

export function arraySum(arr: (number | null | undefined)[]): number {
    return arr.reduce((a, b) => ((a ?? 0) + (b ?? 0))) ?? 0;
}