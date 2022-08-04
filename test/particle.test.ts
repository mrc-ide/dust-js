import { Random, RngStateBuiltin, RngStateObserved } from "@reside-ic/random";

import { base } from "../src/base";
import { Particle } from "../src/particle";
import { dustState } from "../src/state";

import * as models from "./models";

describe("Can create a particle", () => {
    const pars = {n: 1, sd: 1};
    it("is created", () => {
        const r = new RngStateObserved(new RngStateBuiltin());
        const s = new Random(r);
        const cmp = new Random(r.replay());

        const p = new Particle(new models.Walk(base, pars), 0);
        p.run(2, s);
        expect(p.state())
            .toEqual([cmp.randomNormal() + cmp.randomNormal()]);
    });

    it("Can return state", () => {
        const p = new Particle(new models.Walk(base, pars), 0);
        expect(p.size).toEqual(1);
        expect(p.state()).toEqual([0]);
    });

    it("Can run simulation", () => {
        const r = new RngStateObserved(new RngStateBuiltin());
        const s = new Random(r);
        const cmp = new Random(r.replay());

        const p = new Particle(new models.Walk(base, pars), 0);
        p.run(2, s);
        expect(p.state())
            .toEqual([cmp.randomNormal() + cmp.randomNormal()]);

    });

    it("Can set state", () => {
        const p = new Particle(new models.Walk(base, pars), 0);

        expect(p.state()).toEqual([0]);

        p.setState([1]);
        expect(p.state()).toEqual([1]);
    });

    it("Can construct a particle with set state", () => {
        const p = new Particle(new models.Walk(base, pars), 0, [5]);
        expect(p.state()).toEqual([5]);
    });

    it("Can return model info", () => {
        const p = new Particle(new models.Walk(base, pars), 0);
        expect(p.info()).toEqual(
            [{dim: [1], length: 1, name: "x"}]);
    })

    it("Can copy state into a vector view", () => {
        const n = 5;
        const state = dustState(n, 3);
        const pars = {n, sd: 1};
        const p = new Particle(new models.Walk(base, pars), 0);
        p.setState([2, 3, 4, 5, 6]);
        // Copy the full state into the second particle
        p.copyState(null, state.viewParticle(1));
        expect(state.getParticle(0)).toEqual([0, 0, 0, 0, 0]);
        expect(state.getParticle(1)).toEqual([2, 3, 4, 5, 6]);
    });

    it("Can copy partial into a vector view", () => {
        const n = 5;
        const index = [1, 3];
        const state = dustState(index.length, 3);
        const pars = {n, sd: 1};
        const p = new Particle(new models.Walk(base, pars), 0);
        p.setState([2, 3, 4, 5, 6]);
        // Copy the full state into the second particle
        p.copyState(index, state.viewParticle(1));
        expect(state.getParticle(0)).toEqual([0, 0]);
        expect(state.getParticle(1)).toEqual([3, 5]);
    });
});
