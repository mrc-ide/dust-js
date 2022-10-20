import { dustStateTime } from "../src/state-time";
import { meanArray, seq } from "../src/util";
import { tidyDiscreteSolution, tidyDiscreteSolutionVariable, wodinRunDiscrete } from "../src/wodin";

import { rep } from "./helpers";
import * as models from "./models";

describe("wodin interface", () => {
    it("can run a model", () => {
        const pars = { n: 1, sd: 3 };
        const res = wodinRunDiscrete(models.Walk, pars, 0, 10, 1, 3);
        expect(res.x).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(res.values.map((s) => s.mode))
            .toStrictEqual([...rep("Individual", 3), "Mean"]);
        expect(res.values.map((s) => s.name))
            .toStrictEqual(rep("x", 4));
        const y = res.values.map((s) => s.y);
        expect(meanArray(y.slice(0, 3))).toStrictEqual(y[3]);
    });

    it("simplifies deterministic traces", () => {
        const pars = { n: 1, sd: 0 };
        const res = wodinRunDiscrete(models.Walk, pars, 0, 10, 1, 7);
        expect(res).toStrictEqual({
            x: seq(0, 10),
            values: [{ mode: "Deterministic", name: "x", y: rep(0, 11) }]
        });
    });

    it("rescales time", () => {
        const pars = { n: 1, sd: 0 };
        const res = wodinRunDiscrete(models.Walk, pars, 0, 10, 0.1, 7);
        expect(res).toStrictEqual({
            x: seq(0, 100).map((s) => s * 0.1),
            values: [{ mode: "Deterministic", name: "x", y: rep(0, 101) }]
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
            x: times,
            values: [
                { mode: "Deterministic", name: "x", y: rep(0, 4) },
                { mode: "Deterministic", name: "y", y: rep(0, 4) },
                { mode: "Deterministic", name: "z", y: rep(0, 4) },
            ]
        });
    });

    it("identifies a variable as stochastic if any element deviates from mean", () => {
        data.fill(0);
        const trace = state.viewTrace(1, 2); // trace 1 (2nd), particle 2 (3rd)
        trace.set(2, 1);
        const res1 = tidyDiscreteSolutionVariable("y", solution);
        const y1 = {
            mode: "Individual",
            name: "y",
            y: rep(0, 4)
        };
        const y2 = { ...y1, y: [0, 0, 1, 0] };
        const y3 = { ...y1, y: [0, 0, 0.2, 0], mode: "Mean" };
        const x = { mode: "Deterministic", name: "x", y: rep(0, 4) };
        const z = { mode: "Deterministic", name: "z", y: rep(0, 4) };
        const expected = [y1, y1, y2, y1, y1, y3];
        expect(res1).toStrictEqual(expected);
        const res = tidyDiscreteSolution(solution);
        expect(res).toEqual({
            x: times,
            values: [x, ...expected, z]
        });
    });
});