import { combinations, seq } from "../src/util";

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
