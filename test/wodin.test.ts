import { dustStateTime } from "../src/state-time";
import { meanArray, seq } from "../src/util";
import { tidyDiscreteSolution, tidyDiscreteSolution1, wodinRunDiscrete } from "../src/wodin";

import { rep } from "./helpers";
import * as models from "./models";

describe("wodin interface", () => {
    it("can run a model", () => {
        const pars = { n: 1, sd: 3 };
        const res = wodinRunDiscrete(models.Walk, pars, 0, 10, 1, 3);
        expect(res.mode).toStrictEqual([...rep("Individual", 3), "Mean"]);
        expect(res.names).toStrictEqual(rep("x", 4));
        expect(res.x).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(meanArray(res.y.slice(0, 3))).toStrictEqual(res.y[3]);
    });

    it("simplifies deterministic traces", () => {
        const pars = { n: 1, sd: 0 };
        const res = wodinRunDiscrete(models.Walk, pars, 0, 10, 1, 7);
        expect(res).toStrictEqual({
            mode: [ "Deterministic" ],
            names: [ "x" ],
            x: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ],
            y: [ rep(0, 11) ]
        });
    });

    it("rescales time", () => {
        const pars = { n: 1, sd: 0 };
        const res = wodinRunDiscrete(models.Walk, pars, 0, 10, 0.1, 7);
        expect(res).toStrictEqual({
            mode: [ "Deterministic" ],
            names: [ "x" ],
            x: seq(0, 100).map((s) => s * 0.1),
            y: [ rep(0, 101) ]
        });
    });
});

describe("summarise discrete model output", () => {
    const nState = 3;
    const nParticles = 5;
    const times = [0, 1, 2, 3];
    const state = dustStateTime(nState, nParticles, times.length);
    const data = state.state.data as Float64Array;
    const info = [
        { dim: [1], length: 1, name: "x" },
        { dim: [1], length: 1, name: "y" },
        { dim: [1], length: 1, name: "z" }
    ];
    const solution = { info, state, times };

    it("can collapse entirely deterministic output", () => {
        data.fill(0);
        expect(tidyDiscreteSolution(solution)).toStrictEqual({
            mode: rep("Deterministic", 3),
            names: [ "x", "y", "z" ],
            x: times,
            y: rep(rep(0, 4), 3)
        });
    });

    it("identifies a variable as stochastic if any element deviates from mean", () => {
        data.fill(0);
        const trace = state.viewTrace(1, 2); // trace 1 (2nd), particle 2 (3rd)
        trace.set(2, 1);
        const res1 = tidyDiscreteSolution1("y", solution);
        const expected = {
            mode: [...rep("Individual", 5), "Mean"],
            names: rep("y", 6),
            y: [
                rep(0, 4),
                rep(0, 4),
                [0, 0, 1, 0],
                rep(0, 4),
                rep(0, 4),
                [0, 0, 0.2, 0]
            ]
        };
        expect(res1).toStrictEqual(expected);
        const res = tidyDiscreteSolution(solution);
        expect(res).toEqual({
            mode: ["Deterministic", ...expected.mode, "Deterministic"],
            names: ["x", ...expected.names, "z"],
            x: times,
            y: [rep(0, 4), ...expected.y, rep(0, 4)]
        });
    });
});
