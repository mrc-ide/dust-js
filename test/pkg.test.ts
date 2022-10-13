import {
    Random, RngStateBuiltin, RngState, RngStateObserved
} from "@reside-ic/random";

import { PkgWrapper, variableNames } from "../src/pkg";

import * as models from "./models";
import { cumsum, repeat } from "./helpers";

describe("wrapper", () => {
    it("can create a simple wrapped model", () => {
        const rng = new RngStateObserved(new RngStateBuiltin());
        const cmp = new Random(rng.replay());
        const pars = {};
        const mod = new PkgWrapper(models.Walk, pars, rng);

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
        expect(meta).toStrictEqual({
            info: [{ dim: [5], length: 5, name: "x" }],
            names: ["x[1]", "x[2]", "x[3]", "x[4]", "x[5]"],
            size: 5
        });
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
        const mod = new PkgWrapper(models.Walk, pars, rng);
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
        const mod = new PkgWrapper(models.Walk, pars, rng);
        const y = mod.run([0, 1, 2, 3, 4], null);
        // expect(y.info).toStrictEqual(mod.getMetadata());
        expect(y.y).toStrictEqual(cumsum([0, ...repeat(4, () => cmp.normal(0, 1))]));
    });

    it("can run model from given starting y", () => {
        const rng = new RngStateObserved(new RngStateBuiltin());
        const cmp = new Random(rng.replay());
        const pars = {};
        const mod = new PkgWrapper(models.Walk, pars, rng);
        const y = mod.run([0, 1, 2, 3, 4], [10]);
        // expect(y.info).toStrictEqual(mod.getMetadata());
        expect(y.y).toStrictEqual(cumsum([10, ...repeat(4, () => cmp.normal(0, 1))]));
    });

    it("can create a random object staticically", () => {
        const rng = new RngStateObserved(new RngStateBuiltin());
        const r1 = PkgWrapper.random(rng);
        const r2 = PkgWrapper.random(rng.replay());
        const y = repeat(10, () => r1.randomNormal());
        expect(y).toEqual(repeat(10, () => r2.randomNormal()));
    });
});

describe("variableNames", () => {
    it("can generate simple names", () => {
        expect(variableNames([{ dim: [], length: 1, name: "x" }]))
            .toEqual(["x"]);
        expect(variableNames([
            { dim: [], length: 1, name: "x" },
            { dim: [], length: 1, name: "y" }
        ])).toEqual(["x", "y"]);
    });

    it("can generate vector names", () => {
        expect(variableNames([
            { dim: [3], length: 3, name: "x" }
        ])).toEqual(["x[1]", "x[2]", "x[3]"]);
        expect(variableNames([
            { dim: [], length: 1, name: "x" },
            { dim: [3], length: 3, name: "y" }
        ])).toEqual(["x", "y[1]", "y[2]", "y[3]"]);
    });

    it("can generate matrix names", () => {
        expect(variableNames([
            { dim: [2, 3], length: 3, name: "x" }
        ])).toEqual(["x[1,1]", "x[2,1]", "x[1,2]", "x[2,2]", "x[1,3]", "x[2,3]"]);
    });
});
