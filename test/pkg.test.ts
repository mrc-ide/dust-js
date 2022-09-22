import {
    Random, RngStateBuiltin, RngState, RngStateObserved
} from "@reside-ic/random";

import { PkgWrapper } from "../src/pkg";

import * as models from "./models";
import { cumsum, repeat } from "./helpers";

describe("wrapper", () => {
    it("can create a simple wrapped model", () => {
        const rng = new RngStateObserved(new RngStateBuiltin());
        const cmp = new Random(rng.replay());
        const pars = {};
        const mod = new PkgWrapper(models.Walk, pars, new Random(rng));

        expect(mod.initial(0)).toEqual([0]);
        const y = mod.update(0, [0]);
        expect(y).toStrictEqual([cmp.normal(0, 1)]);

        const info = mod.getMetadata();
        const internal = mod.getInternal();
    });

    it("can get model metadata", () => {
        const pars = {n: 5, sd: 2};
        const mod = new PkgWrapper(models.Walk, pars);
        const meta = mod.getMetadata();
        expect(meta).toStrictEqual([
            { dim: [5], length: 5, name: "x" }
        ]);
    });

    it("can get model internals", () => {
        const pars = {n: 5, sd: 2};
        const mod = new PkgWrapper(models.Walk, pars);
        const internal = mod.getInternal();
        expect(internal).toStrictEqual({ n: 5, sd: 2 });
    });

    it("can change parameters", () => {
        const rng = new RngStateObserved(new RngStateBuiltin());
        const cmp = new Random(rng.replay());
        const pars = {};
        const mod = new PkgWrapper(models.Walk, pars, new Random(rng));
        expect(mod.getInternal()).toEqual({ n: 1, sd: 1 });
        const y1 = mod.update(0, [0]);
        expect(y1).toStrictEqual([cmp.normal(0, 1)]);
        mod.setUser({ n: 1, sd: 2 });
        expect(mod.getInternal()).toEqual({ n: 1, sd: 2 });
        const y2 = mod.update(0, [0]);
        expect(y2).toStrictEqual([cmp.normal(0, 2)]);
    });

    it("can run model from default initial conditions", () => {
        const rng = new RngStateObserved(new RngStateBuiltin());
        const cmp = new Random(rng.replay());
        const pars = {};
        const mod = new PkgWrapper(models.Walk, pars, new Random(rng));
        const y = mod.run([0, 1, 2, 3, 4], null);
        expect(y.info).toStrictEqual(mod.getMetadata());
        expect(y.y).toStrictEqual(cumsum([0, ...repeat(4, () => cmp.normal(0, 1))]));
    });

    it("can run model from given starting y", () => {
        const rng = new RngStateObserved(new RngStateBuiltin());
        const cmp = new Random(rng.replay());
        const pars = {};
        const mod = new PkgWrapper(models.Walk, pars, new Random(rng));
        const y = mod.run([0, 1, 2, 3, 4], [10]);
        expect(y.info).toStrictEqual(mod.getMetadata());
        expect(y.y).toStrictEqual(cumsum([10, ...repeat(4, () => cmp.normal(0, 1))]));
    });
});
