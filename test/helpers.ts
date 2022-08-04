import ndarray from "ndarray";
import { dustState } from "../src/state";
import { dustStateTime } from "../src/state-time";

export function filledDustState(nState: number, nParticles: number) {
    const state = dustState(nState, nParticles);
    fillStateWithSequence(state.state);
    return state;
}

export function filledDustStateTime(nState: number, nParticles:
                                    number, nTime: number) {
    const state = dustStateTime(nState, nParticles, nTime);
    fillStateWithSequence(state.state);
    return state;
}

function fillStateWithSequence(state: ndarray.NdArray) {
    const d = state.data as Float64Array;
    for (let i = 0; i < d.length; ++i) {
        d[i] = i;
    }
}
