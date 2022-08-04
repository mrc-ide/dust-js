import { dustStateTime } from "../src/state-time";

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
