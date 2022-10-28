// import { ... } from "@reside-ic/odinjs";

import { seq } from "../src/util";
import { batchRunDiscrete } from "../src/wodin-batch";

import * as models from "./models";

describe("can run batch", () => {
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
        expect(res.solutions.length).toBe(4);
        expect(res.errors).toStrictEqual([]);
        expect(res.solutions[0].x).toStrictEqual(seq(0, 100).map((x) => x * dt));
        expect(res.solutions[0].values).toStrictEqual(
            [{ mode: "Deterministic", name: "x", y: Array(101).fill(0) }]);
        expect(res.solutions[1].values.length).toBe(1);
        expect(res.solutions[1].values[0].mode).toEqual("Mean");

        const end = res.valueAtTime(10);
        expect(end.x).toStrictEqual(pars.values);
        expect(end.values.length).toBe(1);
        expect(end.values[0].name).toBe("x");
        expect(end.values[0].y).toStrictEqual(res.solutions.map((el) => el.values[0].y[100]));

        const max = res.extreme("yMax");
        expect(max.x).toStrictEqual(pars.values);
        expect(max.values.length).toBe(1);
        expect(max.values[0].name).toBe("x");
        expect(max.values[0].y).toStrictEqual(
            res.solutions.map((el) => Math.max(...el.values[0].y)));
    });
});
