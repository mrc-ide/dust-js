import { Times, TimeMode } from "@reside-ic/odinjs";

import { dustStateTime } from "../src/state-time";
import { applyArray, mean, meanArray, seq, seqBy } from "../src/util";
import {
    batchRunDiscrete,
    filterIndex,
    tidyDiscreteSolution,
    tidyDiscreteSolutionVariable,
    wodinRunDiscrete
} from "../src/wodin";

import { rep } from "./helpers";
import * as models from "./models";

describe("wodin interface", () => {
    const allTimes = {
        mode: TimeMode.Grid as const,
        tStart: 0,
        tEnd: 10,
        nPoints: Infinity
    };

    it("can run a model", () => {
        const pars = { n: 1, sd: 3 };
        const sol = wodinRunDiscrete(models.Walk, pars, 0, 10, 1, 3);
        const res = sol(allTimes);
        expect(res.x).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(res.values.map((s) => s.description))
            .toStrictEqual([...rep("Individual", 3), "Mean"]);
        expect(res.values.map((s) => s.name))
            .toStrictEqual(rep("x", 4));
        const y = res.values.map((s) => s.y);
        expect(meanArray(y.slice(0, 3))).toStrictEqual(y[3]);
    });

    it("can customise the summary", () => {
        const pars = { n: 1, sd: 3 };
        const min = (x: number[]) => Math.min(...x);
        const max = (x: number[]) => Math.max(...x);
        const summary = [
            { description: "Min", summary: min },
            { description: "Mean", summary: mean },
            { description: "Max", summary: max }
        ];
        const sol = wodinRunDiscrete(models.Walk, pars, 0, 10, 1, 13, summary);
        const res = sol(allTimes);
        expect(res.x).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(res.values.map((s) => s.description))
            .toStrictEqual([...rep("Individual", 13), "Min", "Mean", "Max"]);
        expect(res.values.map((s) => s.name))
            .toStrictEqual(rep("x", 13 + 3));
        const y = res.values.map((s) => s.y);
        expect(applyArray(y.slice(0, 13), min)).toStrictEqual(y[13]);
        expect(meanArray(y.slice(0, 13))).toStrictEqual(y[14]);
        expect(applyArray(y.slice(0, 13), max)).toStrictEqual(y[15]);
    });

    it("simplifies deterministic traces", () => {
        const pars = { n: 1, sd: 0 };
        const sol = wodinRunDiscrete(models.Walk, pars, 0, 10, 1, 7);
        expect(sol(allTimes)).toStrictEqual({
            x: seq(0, 10),
            values: [{ description: "Deterministic", name: "x", y: rep(0, 11) }]
        });
    });

    it("rescales time", () => {
        const pars = { n: 1, sd: 0 };
        const sol = wodinRunDiscrete(models.Walk, pars, 0, 10, 0.1, 7);
        expect(sol(allTimes)).toStrictEqual({
            x: seq(0, 100).map((s) => s * 0.1),
            values: [{ description: "Deterministic", name: "x", y: rep(0, 101) }]
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
    const summary = [{ description: "Mean", summary: mean }];

    it("can collapse entirely deterministic output", () => {
        data.fill(0);
        expect(tidyDiscreteSolution(solution, summary)).toStrictEqual({
            x: times,
            values: [
                { description: "Deterministic", name: "x", y: rep(0, 4) },
                { description: "Deterministic", name: "y", y: rep(0, 4) },
                { description: "Deterministic", name: "z", y: rep(0, 4) },
            ]
        });
    });

    it("identifies a variable as stochastic if any element deviates from mean", () => {
        data.fill(0);
        const trace = state.viewTrace(1, 2); // trace 1 (2nd), particle 2 (3rd)
        trace.set(2, 1);
        const res1 = tidyDiscreteSolutionVariable("y", solution, summary);
        const y1 = {
            description: "Individual",
            name: "y",
            y: rep(0, 4)
        };
        const y2 = { ...y1, y: [0, 0, 1, 0] };
        const y3 = { ...y1, y: [0, 0, 0.2, 0], description: "Mean" };
        const x = { description: "Deterministic", name: "x", y: rep(0, 4) };
        const z = { description: "Deterministic", name: "z", y: rep(0, 4) };
        const expected = [y1, y1, y2, y1, y1, y3];
        expect(res1).toStrictEqual(expected);
        const res = tidyDiscreteSolution(solution, summary);
        expect(res).toEqual({
            x: times,
            values: [x, ...expected, z]
        });
    });
});

describe("can filter", () => {
    const t = seq(0, 100).map((x) => x * 0.1);
    it("filters based on grid, aligning well", () => {
        const times = {
            mode: TimeMode.Grid as const,
            tStart: 0,
            tEnd: 10,
            nPoints: 11,
        };

        expect(filterIndex(t, times)).toStrictEqual(seqBy(0, 100, 10));
    });

    it("filters a subset aligning inexactly", () => {
        const times = {
            mode: TimeMode.Grid as const,
            tStart: 3.141,
            tEnd: 6.7314,
            nPoints: 20,
        };
        expect(filterIndex(t, times)).toStrictEqual(seqBy(31, 67, 2));
    });

    it("filters for specific points", () => {
        const times = {
            mode: TimeMode.Given as const,
            times: [3.141, 7.7713]
        };
        expect(filterIndex(t, times)).toStrictEqual([31, 78]);
    });
});

describe("can run batch", () => {
    const allTimes = {
        mode: TimeMode.Grid as const,
        tStart: 0,
        tEnd: 10,
        nPoints: Infinity
    };
    it("can run", () => {
        const tEnd = 10;
        const dt = 0.1;
        const nParticles = 7;
        const pars = {
            base: {n: 1, sd: 0},
            name: "sd",
            values: [0, 1, 10, 100]
        };
        const res = batchRunDiscrete(models.Walk, pars, 0, tEnd, dt, nParticles);
        res.run();
        expect(res.solutions.length).toBe(4);
        expect(res.errors).toStrictEqual([]);
        const traces0 = res.solutions[0](allTimes);
        expect(traces0.x).toStrictEqual(seq(0, 100).map((x) => x * dt));
        expect(traces0.values).toStrictEqual(
            [{ description: "Deterministic", name: "x", y: Array(101).fill(0) }]);
        const traces1 = res.solutions[1](allTimes);
        expect(traces1.values.length).toBe(1);
        expect(traces1.values[0].name).toBe("x");
        expect(traces1.values[0].y.slice(1).every((x) => x !== 0)).toBe(true);

        const end = res.valueAtTime(10);
        expect(end.x).toStrictEqual(pars.values);
        expect(end.values.length).toBe(1);
        expect(end.values[0].name).toBe("x");
        expect(end.values[0].y).toStrictEqual(res.solutions.map((el) => el(allTimes).values[0].y[100]));

        const max = res.extreme("yMax");
        expect(max.x).toStrictEqual(pars.values);
        expect(max.values.length).toBe(1);
        expect(max.values[0].name).toBe("x");
        expect(max.values[0].y).toStrictEqual(
            res.solutions.map((el) => Math.max(...el(allTimes).values[0].y)));
    });

    it("can report on near miss values", () => {
        // Unlike odin, if the user asks for a specific time it might
        // not be present due to floating point differences; check
        // that if they're close to a time we get the right time back.
        const tEnd = 10;
        const dt = 0.1;
        const nParticles = 7;
        const pars = {
            base: {n: 1, sd: 0},
            name: "sd",
            values: [0, 1, 10, 100]
        };
        const res = batchRunDiscrete(models.Walk, pars, 0, tEnd, dt, nParticles);
        res.run();
        const end = res.valueAtTime(9 + 1e-4);
        expect(end.values[0].y).toStrictEqual(
            res.solutions.map((el) => el(allTimes).values[0].y[90]));
    });

    it("can return a partial set of results on error", () => {
        const tEnd = 10;
        const dt = 0.1;
        const nParticles = 7;
        const pars = {
            base: {n: 1, sd: 0},
            name: "sd",
            values: [-2, -1, 0, 1, 2]
        };
        const res = batchRunDiscrete(models.Walk, pars, 0, tEnd, dt, nParticles);
        res.run();
        expect(res.pars.values).toStrictEqual([0, 1, 2]);
        expect(res.solutions.length).toBe(3);
    });

    it("can throw if all solutions fail", () => {
        const tEnd = 10;
        const dt = 0.1;
        const nParticles = 7;
        const pars = {
            base: {n: 1, sd: 0},
            name: "sd",
            values: [-3, -2, -1]
        };
        const res = batchRunDiscrete(models.Walk, pars, 0, tEnd, dt, nParticles);
        expect(() => res.run())
            .toThrow("All solutions failed; first error: Expected 'sd' to be at least 0");
    });

    it("can customise summary statistics", () => {
        const min = (x: number[]) => Math.min(...x);
        const max = (x: number[]) => Math.max(...x);
        const summary = [
            { description: "Min", summary: min },
            { description: "Mean", summary: mean },
            { description: "Max", summary: max }
        ];

        const tEnd = 10;
        const dt = 0.1;
        const nParticles = 7;
        const pars = {
            base: {n: 1, sd: 0},
            name: "sd",
            values: [0, 1, 10, 100]
        };
        const res = batchRunDiscrete(models.Walk, pars, 0, tEnd, dt, nParticles,
                                     summary);
        res.run();
        expect(res.solutions.length).toBe(4);
        expect(res.errors).toStrictEqual([]);
        const traces0 = res.solutions[0](allTimes);
        expect(traces0.x).toStrictEqual(seq(0, 100).map((x) => x * dt));
        expect(traces0.values).toStrictEqual(
            [{ description: "Deterministic", name: "x", y: Array(101).fill(0) }]);
        const traces1 = res.solutions[1](allTimes);
        expect(traces1.values.length).toBe(3);
        expect(traces1.values[0].name).toBe("x");
        expect(traces1.values.map((el) => el.name))
            .toStrictEqual(["x", "x", "x"]);
        // TODO: this is the issue with playing loose with types here,
        // will need to fix this in odin-js I think.
        expect(traces1.values.map((el) => (el as any).description))
            .toStrictEqual(["Min", "Mean", "Max"]);
        expect(traces1.values[0].y.slice(1).every((x) => x !== 0)).toBe(true);
        // satisfy Min <= Mean <= Max everywhere:
        const ordered = traces1.x.map((_: any, i: number) => (
            (traces1.values[0].y[i] <= traces1.values[1].y[i]) &&
                (traces1.values[1].y[i] <= traces1.values[2].y[i])));
        expect(ordered.every((x) => x)).toBe(true);

        // TODO: this is not working properly; we've not ended up with
        // the different min/max types here somehow, probably an issue
        // in the summary code in odin....
        const end = res.valueAtTime(10);
        expect(end.x).toStrictEqual(pars.values);
        expect(end.values.length).toBe(1);
        expect(end.values[0].name).toBe("x");
        expect(end.values[0].y).toStrictEqual(res.solutions.map((el) => el(allTimes).values[0].y[100]));

        const ymax = res.extreme("yMax");
        expect(ymax.x).toStrictEqual(pars.values);
        expect(ymax.values.length).toBe(1);
        expect(ymax.values[0].name).toBe("x");
        expect(ymax.values[0].y).toStrictEqual(
            res.solutions.map((el) => Math.max(...el(allTimes).values[0].y)));
    });
});
