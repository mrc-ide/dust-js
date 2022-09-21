import ndarray from "ndarray";
import { dustState } from "../src/state";
import { dustStateTime } from "../src/state-time";
import { seq } from "../src/util";

export function repeat<T>(n: number, f: () => T): T[] {
    const ret = [];
    for (let i = 0; i < n; ++i) {
        ret.push(f());
    }
    return ret;
}

export function filledDustState(nState: number, nParticles: number) {
    const state = dustState(nState, nParticles);
    fillStateWithSequence(state.state);
    return state;
}

export function filledDustStateTime(nState: number, nParticles: number,
                                    steps: number[]) {
    const state = dustStateTime(nState, nParticles, steps);
    fillStateWithSequence(state.state);
    return state;
}

function fillStateWithSequence(state: ndarray.NdArray) {
    const d = state.data as Float64Array;
    for (let i = 0; i < d.length; ++i) {
        d[i] = i;
    }
}

const sqrtDoubleEpsilon = Math.pow(2, -52 / 2);

export function approxEqual(x: number, y: number,
                            tolerance = sqrtDoubleEpsilon) {
    let xy = Math.abs(x - y);
    const xn = Math.abs(x);
    if (xn > tolerance) {
        xy /= xn;
    }
    return xy < tolerance;
}

export function approxEqualArray(x: Float64Array, y: Float64Array,
                                 tolerance = sqrtDoubleEpsilon) {
    if (y.length !== x.length) {
        throw Error("Incompatible arrays");
    }
    let scale = 0;
    let xy = 0;
    let n = 0;
    for (let i = 0; i < x.length; ++i) {
        if (x[i] !== y[i]) {
            scale += Math.abs(x[i]);
            xy += Math.abs(x[i] - y[i]);
            n++;
        }
    }
    if (n === 0) {
        return true;
    }

    scale /= n;
    xy /= n;

    if (scale > tolerance) {
        xy /= scale;
    }
    return xy < tolerance;
}
