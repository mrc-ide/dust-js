import { resample } from "../src/filter-support";

// Compare with R version:
//
// resample_index <- function(w, u) {
//   n <- length(w)
//   uu <- u / n + seq(0, by = 1 / n, length.out = n)
//   findInterval(uu, cumsum(w / sum(w)))
// }
describe("check against reference", () => {
    it("works on trivial cases", () => {
        expect(resample([], 0)).toStrictEqual([]);
        expect(resample([0.1], 0)).toStrictEqual([0]);
    });

    it("reduces to a single particle when that is where all probability lies", () => {
        expect(resample([0, 0, 1, 0, 0], 0.1)).toStrictEqual([2, 2, 2, 2, 2]);
        expect(resample([0, 0, 1, 0, 0], 1e-8)).toStrictEqual([2, 2, 2, 2, 2]);
        expect(resample([0, 0, 1, 0, 0], 1)).toStrictEqual([2, 2, 2, 2, 2]);
    });

    it("agrees with some cases created with reference implementation", () => {
        expect(resample([1, 2, 3, 4, 5, 6], 0.2)).toStrictEqual([0, 2, 3, 4, 4, 5]);
        expect(resample([0.24, 0.3, 0.37, 0.54, 0.25, 0.94], 0.95))
            .toStrictEqual([1, 2, 3, 5, 5, 5]);
    });
});
