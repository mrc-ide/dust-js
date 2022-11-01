import { combinations, findClosest, search, seq } from "../src/util";

describe("seq", () => {
    it("generates an inclusive sequence", () => {
        expect(seq(2, 5)).toStrictEqual([2, 3, 4, 5]);
        expect(seq(2, 2)).toStrictEqual([2]);
    });

    it("copes with impossible case gracefully", () => {
        expect(seq(2, 1)).toStrictEqual([]);
    });
});

describe("combinations", () => {
    expect(combinations([])).toEqual([]);
    expect(combinations([1])).toEqual([[1]]);
    expect(combinations([2])).toEqual([[1], [2]]);
    expect(combinations([2, 3])).toEqual([
        [1, 1], [2, 1], [1, 2], [2, 2], [1, 3], [2, 3]
    ]);
});

describe("search", () => {
    it("can search simple list", () => {
        const x = seq(1, 5);
        expect(search(x, (el) => el > -5)).toBe(0);
        expect(search(x, (el) => el >= 2)).toBe(1);
        expect(search(x, (el) => el > 2)).toBe(2);
        expect(search(x, (el) => el > 2.5)).toBe(2);
        expect(search(x, (el) => el >= 5)).toBe(4);
        expect(search(x, (el) => el > 5)).toBe(5);
    });

    it("searches efficiently", () => {
        let n = 0;
        const target = (x: number) => {
            n++;
            return x > 1234;
        }
        const x = seq(1, 10000);
        expect(search(x, target)).toBe(1234);
        expect(n).toBe(16);
        expect(target(x[1233])).toBe(false);
        expect(target(x[1234])).toBe(true);
    });
});

describe("findClosest", () => {
    it("finds exact matches", () => {
        const arr = seq(4, 50);
        // one in detail:
        const i = findClosest(10, arr);
        expect(i).toBe(6);
        expect(arr[i]).toBe(10);
        // just do the lot:
        arr.forEach((x) => expect(arr[findClosest(x, arr)]).toBe(x));
    });

    it("finds close matches", () => {
        const arr = seq(4, 50);
        // one in detail:
        const i = findClosest(10.001, arr);
        expect(i).toBe(6);
        expect(arr[i]).toBe(10);
        // just do the lot:
        arr.forEach((x) => expect(arr[findClosest(x + 0.001, arr)]).toBe(x));
    });

    it("finds distant matches", () => {
        const arr = seq(4, 50);
        const i = findClosest(9.8, arr);
        expect(i).toBe(6);
        expect(arr[i]).toBe(10);
        arr.forEach((x) => expect(arr[findClosest(x - 0.2, arr)]).toBe(x));
    });
});
