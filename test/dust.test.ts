import * as models from "./models";
import { Dust } from "../src/dust";
import { approxEqualArray, repeat } from "./helpers";

import {
    Random, RngStateBuiltin, RngState, RngStateObserved
} from "@reside-ic/random";

describe("Can create a dust object", () => {
    const pars = {n: 1, sd: 1};
    it("is created", () => {
        const s = new Random(new RngStateBuiltin());
        const p = new Dust(models.Walk, pars, 5, 0, s);
        expect(p.step()).toEqual(0);
        expect(p.nState()).toEqual(1);
        expect(p.nParticles()).toEqual(5);
        expect(p.state(null).asMatrix()).toEqual(Array(5).fill([0]));
    });

    it("Can return state", () => {
        const s = new Random(new RngStateBuiltin());
        const p = new Dust(models.Walk, pars, 5, 0, s);
        expect(p.state(null).asMatrix()).toEqual(Array(5).fill([0]));
        expect(p.state([0]).asMatrix()).toEqual(Array(5).fill([0]));
        expect(p.state([0, 0]).asMatrix()).toEqual(Array(5).fill([0, 0]));
    });

    it("requires at least one particle", () => {
        const s = new Random(new RngStateBuiltin());
        expect(() => new Dust(models.Walk, pars, 0, 0, s))
            .toThrow("Expected at least one particle");
        expect(() => new Dust(models.Walk, pars, -5, 0, s))
            .toThrow("Expected at least one particle");
    });

    it("Can run simulation", () => {
        const r = new RngStateObserved(new RngStateBuiltin());
        const s = new Random(r);
        const cmp = new Random(r.replay());
        const np = 5;
        const p = new Dust(models.Walk, pars, np, 0, s);
        p.run(2);
        const expected = [];
        for (let i = 0; i < 5; ++i) {
            expected.push([cmp.randomNormal() + cmp.randomNormal()]);
        }

        expect(p.state(null).asMatrix()).toEqual(expected);
        expect(p.step()).toEqual(2);
    });
});

describe("Create multi-particle, multi-state objects", () => {
    const pars = {n: 3, sd: 1};
    it("interleaves particle state", () => {
        const r = new RngStateObserved(new RngStateBuiltin());
        const s = new Random(r);
        const cmp = new Random(r.replay());
        const p = new Dust(models.Walk, pars, 5, 0, s);
        expect(p.step()).toEqual(0)
        expect(p.nState()).toEqual(3)
        expect(p.state(null).asMatrix()).toEqual(Array(5).fill([0, 0, 0]));
        p.run(2);
        const y = p.state(null).asMatrix();

        // 3 states * 5 particles * 2 steps
        const z = repeat(3 * 5 * 2, () => cmp.normal(0, 1));
        // Then we need to sum these up, we do each particle in turn
        expect(y[0]).toEqual(
            [z[0] + z[3], z[1] + z[4], z[2] + z[5]]);
        expect(y[1]).toEqual(
            [z[0 + 6] + z[3 + 6], z[1 + 6] + z[4 + 6], z[2 + 6] + z[5 + 6]]);
    });

    it("can simulate, accumulating state in the expected way", () => {
        const r = new RngStateObserved(new RngStateBuiltin());
        const np = 5;
        const d = new Dust(models.Walk, pars, np, 0, new Random(r));
        const cmp = new Dust(models.Walk, pars, np, 0, new Random(r.replay()));

        const res = d.simulate([0, 1, 2, 3, 4, 5, 6], null); // length 7

        expect(res.getParticle(0, 0)).toEqual([0, 0, 0]);
        expect(res.getState(0, 0)).toEqual([0, 0, 0, 0, 0]);
        expect(res.viewTime(0).getParticle(0)).toEqual([0, 0, 0]);
        expect(res.viewTime(0).getState(0)).toEqual([0, 0, 0, 0, 0]);

        cmp.run(1);
        const cmp1 = cmp.state(null);
        expect(res.getParticle(0, 1)).toEqual(cmp1.getParticle(0));
        expect(res.getParticle(3, 1)).toEqual(cmp1.getParticle(3));

        // If we had proper rng streams it would not matter here and
        // we could just run things right up time 4 in one go and the
        // numbers would remain the same. This is fine for now though.
        cmp.run(2);
        cmp.run(3);
        cmp.run(4);
        const cmp4 = cmp.state(null);
        expect(res.getParticle(0, 4)).toEqual(cmp4.getParticle(0));
        expect(res.getParticle(3, 4)).toEqual(cmp4.getParticle(3));

        cmp.run(5);
        cmp.run(6);

        const cmp6 = cmp.state(null);
        expect(res.getParticle(0, 6)).toEqual(cmp6.getParticle(0));
        expect(res.getParticle(3, 6)).toEqual(cmp6.getParticle(3));

        expect(d.state(null).state.data)
            .toEqual(cmp6.state.data);
    });

    it("can simulate, subsetting output", () => {
        const r = new RngStateObserved(new RngStateBuiltin());
        const np = 5;
        const d = new Dust(models.Walk, pars, np, 0, new Random(r));
        const cmp = new Dust(models.Walk, pars, np, 0, new Random(r.replay()));
        const idx = [1, 2];
        const t = [0, 1, 2, 4, 5, 6, 7];
        const res = d.simulate(t, idx);
        const resFull = cmp.simulate(t, null);
        expect(res.nState).toBe(2);
        expect(res.getState(0, 5)).toEqual(resFull.getState(1, 5));
        expect(res.getState(1, 5)).toEqual(resFull.getState(2, 5));
    });

    it("can get model info", () => {
        const r = new Random(new RngStateBuiltin());
        const d = new Dust(models.Walk, pars, 5, 0, r);
        const info = d.info();
        expect(info).toEqual([{dim: [3], length: 3, name: "x"}]);
    })
});

describe("can set parameters", () => {
    it("Can change parameters", () => {
        const p1 = {n: 3, sd: 1};
        const p2 = {n: 3, sd: 2};
        const np = 5;

        const r = new RngStateObserved(new RngStateBuiltin());
        const s = new Random(r);
        const d1 = new Dust(models.Walk, p1, np, 0, s);
        const d2 = new Dust(models.Walk, p2, np, 0, new Random(r.replay()));

        d1.setPars(p2, false);
        d1.run(1);
        d2.run(1);

        expect(d1.state(null).state.data)
            .toEqual(d2.state(null).state.data);
    });

    it("prevents changing size of the system", () => {
        const p1 = {n: 3, sd: 1};
        const p2 = {n: 9, sd: 2};
        const np = 5;

        const s = new Random(new RngStateBuiltin());
        const d = new Dust(models.Walk, p1, np, 0, s);
        expect(() => d.setPars(p2, false))
            .toThrow("Particle produced unexpected state size");
    });

    it("Can change parameters and update state", () => {
        const p1 = {n: 3, sd: 1};
        const p2 = {n: 3, sd: 2};
        const np = 4;

        const s = new Random(new RngStateBuiltin());
        const d = new Dust(models.Walk, p1, np, 0, s);
        d.run(5);
        d.setPars(p2, true);
        expect(d.state(null).asMatrix()).toEqual(Array(np).fill([5, 5, 5]))
    });
});

describe("can set step", () => {
    it("can be set", () => {
        const pars = {n: 1, sd: 1};
        const s = new Random(new RngStateBuiltin());
        const d = new Dust(models.Walk, pars, 5, 0, s);
        expect(d.step()).toEqual(0);
        d.setStep(10);
        expect(d.step()).toEqual(10);
    });
});

describe("can set state", () => {
    it("can set state", () => {
        const pars = {n: 4, sd: 1};
        const r = new RngStateObserved(new RngStateBuiltin());
        const s = new Random(r);
        const np = 3;
        const d1 = new Dust(models.Walk, pars, np, 0, s);
        const d2 = new Dust(models.Walk, pars, np, 0, new Random(r.replay()));

        const state = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]];

        d1.setState(state);
        expect(d1.state(null).asMatrix()).toEqual(state);
        d1.run(1);
        d2.run(1);

        // This can be off at the last place, stochastically because
        // of rounding error.
        const s1 = d1.state(null).state.data as Float64Array;
        const s2 = d2.state(null).state.data as Float64Array;
        for (let i = 0; i < 12; ++i) {
            s2[i] = s2[i] + i + 1;
        }
        expect(approxEqualArray(s1, s2)).toEqual(true);
    });

    it("validates state as it sets it", () => {
        const pars = {n: 2, sd: 1};
        const r = new Random(new RngStateBuiltin());
        const d = new Dust(models.Walk, pars, 3, 0, r);

        expect(() => d.setState([[0, 1]])).toThrow(
            "Invalid length state, expected 3 but given 1");
        expect(() => d.setState([[0], [1], [2], [3], [4]])).toThrow(
            "Invalid length state, expected 3 but given 5");
        expect(() => d.setState([[0], [1], [2]])).toThrow(
            "Invalid length state for particle 0, expected 2 but given 1");
        expect(() => d.setState([[0, 0], [1, 1], [2, 2, 2]])).toThrow(
            "Invalid length state for particle 2, expected 2 but given 3");

        // Unchanged:
        expect(d.state(null).asMatrix()).toEqual(Array(3).fill([0, 0]))
    });
});
