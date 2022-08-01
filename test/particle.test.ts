import { Random, RngStateBuiltin, RngStateObserved } from "@reside-ic/random";

import { base } from "../src/base";
import { Particle } from "../src/particle";

import * as models from "./models";

describe("Can create a particle", () => {
    const pars = {n: 1, sd: 1};
    it("is created", () => {
        const r = new RngStateObserved(new RngStateBuiltin());
        const s = new Random(r);
        const cmp = new Random(r.replay());

        const p = new Particle(new models.Walk(base, pars), 0);
        p.run(2, s);
        expect(p.state(null))
            .toEqual([cmp.randomNormal() + cmp.randomNormal()]);
    });

    it("Can return state", () => {
        const p = new Particle(new models.Walk(base, pars), 0);
        expect(p.size).toEqual(1);
        expect(p.state(null)).toEqual([0]);
        expect(p.state([0])).toEqual([0]);
        expect(p.state([0, 0])).toEqual([0, 0]);
    });

    it("Can run simulation", () => {
        const r = new RngStateObserved(new RngStateBuiltin());
        const s = new Random(r);
        const cmp = new Random(r.replay());

        const p = new Particle(new models.Walk(base, pars), 0);
        p.run(2, s);
        expect(p.state(null))
            .toEqual([cmp.randomNormal() + cmp.randomNormal()]);

    });

    it("Can set state", () => {
        const p = new Particle(new models.Walk(base, pars), 0);

        expect(p.state(null)).toEqual([0]);
        expect(p.state([0])).toEqual([0]);
        expect(p.state([0, 0])).toEqual([0, 0]);

        p.setState([1]);
        expect(p.state(null)).toEqual([1]);
    });

    it("Can construct a particle with set state", () => {
        const p = new Particle(new models.Walk(base, pars), 0, [5]);
        expect(p.state(null)).toEqual([5]);
    });

    it("Can return model info", () => {
        const p = new Particle(new models.Walk(base, pars), 0);
        expect(p.info()).toEqual(
            [{dim: [1], length: 1, name: "x"}]);
    })
});
