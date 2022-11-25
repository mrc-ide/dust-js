// This is pretty nasty, and is derived from the C++ version, which
// has been carefully checked against the R version, which is
// implemented very differently (see mcstate):
//
// particle_resample <- function(weights) {
//   n <- length(weights)
//   u <- runif(1, 0, 1 / n) + seq(0, by = 1 / n, length.out = n)
//   cum_weights <- cumsum(weights / sum(weights))
//   findInterval(u, cum_weights) + 1L
// }
//
// Take u as U(0, 1) and weights are in normal (non-logarithmic) space
export function resample(weights: number[], u: number): number[] {
    const n = weights.length;
    const tot = weights.reduce((a, b) => a + b, 0);
    const u0 = tot * u / n;
    const du = tot / n;
    let ww = 0;
    let j = 0;
    const ret: number[] = [];
    for (let i = 0; i < n; ++i) {
        const uu = u0 + i * du;
        // The second clause (i.e., j < n) should never be hit but
        // prevents any invalid read if we have pathalogical 'u' that
        // is within floating point eps of 1
        while (ww < uu && j < n) {
            ww += weights[j];
            j += 1;
        }
        ret.push(j == 0 ? 0 : j - 1);
    }
    return ret;
}
