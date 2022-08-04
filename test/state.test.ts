import { dustState } from "../src/state";
import { dustStateTime } from "../src/state-time";


describe("dust state at a single time point", () => {
    const nState = 5;
    const nParticles = 7;
    it("can be constructed", () => {
        const state = dustState(nState, nParticles);
        expect(state.nState).toBe(nState);
        expect(state.nParticles).toBe(nParticles);
    });
});

describe("dust state at multiple time points", () => {
    it("can be constructed", () => {
        const nState = 5;
        const nParticles = 7;
        const nTime = 11;
        const state = dustStateTime(nState, nParticles, nTime);
        expect(state.nState).toBe(nState);
        expect(state.nParticles).toBe(nParticles);
        expect(state.nTime).toBe(nTime);
    });
});
