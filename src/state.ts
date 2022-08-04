// This file exists to abstract some of the array handling as it's a
// general source of drama, and because I expect we'll swap out the
// tensor backend for one that is typesafe in terms of dimensions. No
// other file should directly import ndarray
import ndarray from "ndarray";

/**
 * Create a new {@link DustState} object, allocating the underlying
 * storage
 *
 * @param nState Number of state variables
 *
 * @param nParticles Number of particles
 */
export function dustState(nState: number, nParticles: number): DustState {
    const data = ndarray(new Float64Array(nState * nParticles),
                         [nParticles, nState]);
    return new DustState(data, nState, nParticles);
}

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
 * A one dimensional (slice) out of a {@link DustState} or {@link
 * DustStateTime} object
 */
export interface VectorView {
    /** An array of length 1 containing the vector length */
    shape: number[];
    /**
     * Get the ith value
     * @param i Index to fetch
     */
    get(i: number): number;
    /**
     * Set the ith value, modifying the underlying object as well as
     * the view.
     *
     * @param i Index to set
     * @param value The value to replace into the vector
     */
    set(i: number, value: number): void;
}

/**
 * Matrix-like object representing the state of a dust model at a
 * single point in time (vs a 3d-array like object {@link
 * DustStateTime}. This object exists to simplify thinking about
 * accessing different parts of the data, as primitives for doing this
 * don't really exist in JavaScript. It also leaves us free to swap
 * out the underling storage later (currently using `ndarray`)
 */
export class DustState {
    /** The underling state */
    public readonly state: ndarray.NdArray;
    /** The number of state elements per particle */
    public readonly nState;
    /** The number of particles */
    public readonly nParticles;

    /**
     * Construct a new object - generally prefer {@link dustState}
     * which also allocates the `data` correctly
     *
     * @param data The underlying data
     * @param nState The number of state elements per particle
     * @param nParticles The number of particles
     */
    constructor(data: ndarray.NdArray, nState: number, nParticles: number) {
        this.nState = nState;
        this.nParticles = nParticles;
        this.state = data;
    }

    /**
     * Construct a {@link VectorView} for a single particle. This can
     * then be easily read from or written to.
     * @param iParticle The index of the particle to fetch
     */
    public viewParticle(iParticle: number): VectorView {
        return this.state.pick(iParticle, null);
    }

    /**
     * Construct a {@link VectorView} for a single state, across all
     * particles. This can then be easily read from or written to.
     * @param iState The index of the state to fetch
     */
    public viewState(iState: number): VectorView {
        return this.state.pick(null, iState);
    }

    /**
     * Copy the state for a single vector into a plain JavaScript
     * numeric array. This will then be decoupled from the underlying
     * object
     * @param iParticle The index of the particle to fetch
     */
    public getParticle(iParticle: number): number[] {
        return copyVector(this.viewParticle(iParticle));
    }

    /**
     * Copy a single state across all variables into a plain
     * JavaScript numeric array. This will then be decoupled from the
     * underlying object
     * @param iState The index of the state to fetch
     */
    public getState(iState: number): number[] {
        return copyVector(this.viewState(iState));
    }

    /**
     * Create a matrix of particle states. The `i`th element of the
     * returned matrix is the state of the `i`th particle, itself a
     * vector of lenth `nState`
     */
    public asMatrix(): number[][] {
        const ret = [];
        for (let i = 0; i < this.nParticles; ++i) {
            ret.push(this.getParticle(i));
        }
        return ret;
    }
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
    /** The underling state */
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

export function copyVector(src: VectorView): number[] {
    const len = src.shape[0];
    const dst = Array(len);
    for (let i = 0; i < len; ++i) {
        dst[i] = src.get(i);
    }
    return dst;
}
