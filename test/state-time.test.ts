import { dustStateTime } from "../src/state-time";

import { filledDustStateTime } from "./helpers";

describe("dust state at multiple time points", () => {
    const nState = 5;
    const nParticles = 7;
    const nTime = 11;
    it("can be constructed", () => {
        const state = dustStateTime(nState, nParticles, nTime);
        expect(state.nState).toBe(nState);
        expect(state.nParticles).toBe(nParticles);
        expect(state.nTime).toBe(nTime);
    });

    it("can extract a time view", () => {
        const state = filledDustStateTime(nState, nParticles, nTime);
        const t0 = state.viewTime(0);
        expect(t0.getParticle(0)).toEqual([0, 1, 2, 3, 4]);
        expect(t0.getParticle(3)).toEqual([15, 16, 17, 18, 19]);
        const t5 = state.viewTime(5);
        expect(t5.getParticle(0)).toEqual([175, 176, 177, 178, 179]);
        expect(t5.getParticle(3)).toEqual([190, 191, 192, 193, 194]);
    });

    it("can extract a particle at a specific time", () => {
        const state = filledDustStateTime(nState, nParticles, nTime);
        const t0 = state.viewTime(0);
        const t5 = state.viewTime(5);
        expect(state.getParticle(0, 0)).toEqual(t0.getParticle(0));
        expect(state.getParticle(3, 0)).toEqual(t0.getParticle(3));
        expect(state.getParticle(0, 5)).toEqual(t5.getParticle(0));
        expect(state.getParticle(3, 5)).toEqual(t5.getParticle(3));
    });

    it("can extract a state at a specific time", () => {
        // Similar to above, but using getState, not getParticle
        const state = filledDustStateTime(nState, nParticles, nTime);
        const t0 = state.viewTime(0);
        const t5 = state.viewTime(5);
        expect(state.getState(0, 0)).toEqual(t0.getState(0));
        expect(state.getState(3, 0)).toEqual(t0.getState(3));
        expect(state.getState(0, 5)).toEqual(t5.getState(0));
        expect(state.getState(3, 5)).toEqual(t5.getState(3));
    });

    it("can extract a specific trace", () => {
        const state = filledDustStateTime(nState, nParticles, nTime);
        const expected = [0, 35, 70, 105, 140, 175, 210, 245, 280, 315, 350];
        expect(state.getTrace(0, 0)).toEqual(expected);
        expect(state.getTrace(1, 0)).toEqual(expected.map((x) => x + 1));
        expect(state.getTrace(0, 1)).toEqual(expected.map((x) => x + 5));
        expect(state.getTrace(1, 1)).toEqual(expected.map((x) => x + 6));
    });
});
