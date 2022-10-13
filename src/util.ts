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
        const ret = [];
        for (let i = 0; i < rest.length; ++i) {
            for (let j = 0; j < n.length; ++j) {
                ret.push([n[j], ...rest[i]])
            }
        }
        return ret;
    } else {
        return n.map((el: number) => [el]);
    }
}
