import { applyArray, isEqualArray, mean, meanArray, rep, seq } from "../src/util";

describe("seq", () => {
    it("generates an inclusive sequence", () => {
        expect(seq(2, 5)).toStrictEqual([2, 3, 4, 5]);
        expect(seq(2, 2)).toStrictEqual([2]);
    });

    it("copes with impossible case gracefully", () => {
        expect(seq(2, 1)).toStrictEqual([]);
    });
});

describe("rep", () => {
    it("repeats simple things", () => {
        expect(rep(1, 5)).toEqual([1, 1, 1, 1, 1]);
        expect(rep(1, 0)).toEqual([]);
    });

    it("repeats complex things", () => {
        const obj = {a: 1};
        expect(rep(obj, 3)).toStrictEqual([obj, obj, obj]);
    });
});

describe("isEqualArray", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 3, 4, 5, 6];
    const z = [1, 2, 3 + 1e-8, 4, 5];

    it("is true when all elements are the same", () => {
        expect(isEqualArray(x, x)).toBe(true);
        expect(isEqualArray(x, [...x])).toBe(true);
    });

    it("is false when any element is different", () => {
        expect(isEqualArray(x, y)).toBe(false);
        expect(isEqualArray(x, z)).toBe(false);
    });
});

describe("mean", () => {
    it("computes the mean", () => {
        expect(mean([1, 2, 3, 4, 5])).toBeCloseTo(3);
        expect(mean([1])).toBe(1);
        expect(mean([])).toBe(NaN);
    });
});

describe("applyArray", () => {
    it("can collect statistics over an array", () => {
        const m = [
            [1, 2, 3, 4],
            [3, 4, 5, 6]
        ];
        expect(applyArray(m, mean)).toStrictEqual([2, 3, 4, 5]);
        expect(applyArray(m, mean)).toStrictEqual(meanArray(m));
    });
});
