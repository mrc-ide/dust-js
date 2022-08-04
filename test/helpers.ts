import { dustState } from "../src/state";

export function filledDustState(nState: number, nParticles: number) {
    const state = dustState(nState, nParticles);
    const d = state.state.data as Float64Array;
    for (let i = 0; i < nState * nParticles; ++i) {
        d[i] = i;
    }
    return state;
}
