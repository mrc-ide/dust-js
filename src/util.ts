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

export function findClosest(x: number, arr: number[]) {
    const i = search(arr, (el) => el >= x);
    if (arr[i] === x || i === 0) {
        return i;
    }
    if (i === arr.length) {
        return arr.length - 1;
    }
    return (x - arr[i - 1]) < (arr[i] - x) ? i - 1 : i;
}

export function search(x: number[], pred: (el: number) => boolean) {
    // Aim is to find the first element that is `true` for this condition.
    const n = x.length;
    let left = 0;
    let right = n - 1;
    if (!pred(x[right])) {
        return n;
    }
    if (pred(x[left])) {
        return 0;
    }
    // At this point we have
    //      0  1  2     n-2   n-1
    // [false, ?, ?, ..., ?, true]
    //   left                right
    while (right - left > 1) {
        const m = Math.floor((left + right) / 2);
        if (pred(x[m])) {
            right = m;
        } else {
            left = m;
        }
    }

    return right;
}
