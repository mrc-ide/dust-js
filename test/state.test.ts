import ndarray from "ndarray";

import { dustState } from "../src/state";

import { filledDustState } from "./helpers";

describe("dust state at a single time point", () => {
    const nState = 5;
    const nParticles = 7;
    it("can be constructed", () => {
        const state = dustState(nState, nParticles);
        expect(state.nState).toBe(nState);
        expect(state.nParticles).toBe(nParticles);
    });

    it("can extract a single particle", () => {
        const state = filledDustState(nState, nParticles);
        const p0 = state.viewParticle(0);
        expect(p0.get(0)).toBe(0);
        expect(p0.get(4)).toBe(4);
        const p3 = state.viewParticle(3);
        expect(p3.get(0)).toBe(15);
        expect(p3.get(4)).toBe(19);

        expect(state.getParticle(0)).toEqual([0, 1, 2, 3, 4]);
        expect(state.getParticle(3)).toEqual([15, 16, 17, 18, 19]);
    });

    it("can extract a state across particles", () => {
        const state = filledDustState(nState, nParticles);
        const p0 = state.viewState(0);
        expect(p0.get(0)).toBe(0);
        expect(p0.get(4)).toBe(20);
        const p3 = state.viewState(3);
        expect(p3.get(0)).toBe(3);
        expect(p3.get(4)).toBe(23);

        expect(state.getState(0)).toEqual([0, 5, 10, 15, 20, 25, 30]);
        expect(state.getState(3)).toEqual([3, 8, 13, 18, 23, 28, 33]);
    });

    it("can extract the state as a matrix", () => {
        const state = filledDustState(nState, nParticles);
        const m = state.asMatrix();
        expect(m.length).toBe(nParticles);
        expect(m[0]).toEqual(state.getParticle(0));
        expect(m[3]).toEqual(state.getParticle(3));
    });

    it("can mutate extracted particle state", () => {
        const state = filledDustState(nState, nParticles);
        const p = state.viewParticle(3);
        for (let i = 0; i < nState; ++i) {
            p.set(i, -i);
        }
        expect(state.getParticle(3)).toEqual([-0, -1, -2, -3, -4]);
    })
});
