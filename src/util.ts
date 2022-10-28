export function seq(a: number, b: number): number[] {
    const ret = [];
    for (let i = a; i <= b; ++i) {
        ret.push(i);
    }
    return ret;
}

export function seqBy(a: number, b: number, by: number) {
    const ret = [];
    for (let i = a; i <= b; i += by) {
        ret.push(i);
    }
    return ret;
}

export function combinations(arr: number[]): number[][] {
    const ret: number[][] = [];
    const n = seq(1, arr[0]);

    if (arr.length > 1) {
        const rest = combinations(arr.slice(1));
        const ret = [] as number[][];
        for (const i of rest) {
            for (const j of n) {
                ret.push([j, ...i]);
            }
        }
        return ret;
    } else {
        return n.map((el: number) => [el]);
    }
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
