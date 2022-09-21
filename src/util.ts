export function seq(a: number, b: number): number[] {
    const ret = [];
    for (let i = a; i <= b; ++i) {
        ret.push(i);
    }
    return ret;
}

export function rep(x: any, n: number): (typeof x)[] {
    return Array(n).fill(x);
}

export function isEqualArray(a: number[], b: number[]): boolean {
    return a.every((val, idx) => val === b[idx])
}

export function applyArray(y: number[][], fn: (yi: number[]) => number): number[] {
    return y[0].map(
        (_: any, i: number) => fn(y.map((row: number[]) => row[i])));
}

export function mean(x: number[]): number {
    return x.reduce((a, b) => a + b, 0) / x.length;
}

export function meanArray(y: number[][]) {
    return applyArray(y, mean);
}
