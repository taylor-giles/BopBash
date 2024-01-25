export function arraySum(arr: (number | null | undefined)[]): number {
    return arr.reduce((a, b) => ((a ?? 0) + (b ?? 0))) ?? 0;
}