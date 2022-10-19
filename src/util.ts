export function seq(a: number, b: number): number[] {
    const ret = [];
    for (let i = a; i <= b; ++i) {
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
