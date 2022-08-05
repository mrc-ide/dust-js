import ndarray from "ndarray";

import { copyVector, DustState, VectorView } from "./state";

/**
 * Create a new {@link DustStateTime} object, allocating the
 * underlying storage
 *
 * @param nState Number of state variables
 *
 * @param nParticles Number of particles
 *
 * @param nTime Number of time steps
 */
export function dustStateTime(nState: number, nParticles: number,
                              nTime: number) {
    const data = ndarray(new Float64Array(nState * nParticles * nTime),
                         [nTime, nParticles, nState]);
    return new DustStateTime(data, nState, nParticles, nTime);
}

/**
 * 3d-array-like object representing the state of a dust model at
 * multiple points in time (vs a matrix-like object {@link
 * DustState}. This object exists to simplify thinking about accessing
 * different parts of the data, as primitives for doing this don't
 * really exist in JavaScript. It also leaves us free to swap out the
 * underling storage later (currently using `ndarray`)
 */
export class DustStateTime {
    /** The underlying state */
    public readonly state: ndarray.NdArray;
    /** The number of state elements per particle */
    public readonly nState;
    /** The number of particles */
    public readonly nParticles;
    /** The number of time steps */
    public readonly nTime;

    /**
     * Construct a new object - generally prefer {@link dustStateTime}
     * which also allocates the `data` correctly
     *
     * @param data The underlying data
     * @param nState The number of state elements per particle
     * @param nParticles The number of particles
     * @param nTime The number of time steps
     */
    constructor(data: ndarray.NdArray, nState: number, nParticles: number,
                nTime: number) {
        this.nState = nState;
        this.nParticles = nParticles;
        this.nTime = nTime;
        this.state = data;
    }

    /**
     * Construct a view of a single time point - a {@link DustState}
     * object - which can then be used to view or modify the state at
     * this time point.
     *
     * @param iTime The index in time
     */
    public viewTime(iTime: number): DustState {
        const data = this.state.pick(iTime, null, null);
        return new DustState(data, this.nState, this.nParticles);
    }

    /**
     * Construct a {@link VectorView} for a single particle at a
     * single point in time. This can then be easily read from or
     * written to.
     * @param iParticle The index of the particle to fetch
     * @param iTime The index of the time to fetch
     */
    public viewParticle(iParticle: number, iTime: number): VectorView {
        return this.state.pick(iTime, iParticle, null);
    }

    /**
     * Construct a {@link VectorView} for a single state, across all
     * particles at a single point in time. This can then be easily
     * read from or written to.
     * @param iState The index of the state to fetch
     * @param iTime The index of the time to fetch
     */
    public viewState(iState: number, iTime: number): VectorView {
        return this.state.pick(iTime, null, iState);
    }

    /**
     * Copy the state for a single vector at a single point in time
     * into a plain JavaScript numeric array. This will then be
     * decoupled from the underlying object
     * @param iParticle The index of the particle to fetch
     * @param iTime The index of the time to fetch
     */
    public getParticle(iParticle: number, iTime: number): number[] {
        return copyVector(this.viewParticle(iParticle, iTime));
    }

    /**
     * Copy a single state across all variables at a single point in
     * time into a plain JavaScript numeric array. This will then be
     * decoupled from the underlying object
     * @param iState The index of the state to fetch
     * @param iTime The index of the time to fetch
     */
    public getState(iState: number, iTime: number): number[] {
        return copyVector(this.viewState(iState, iTime));
    }
}
