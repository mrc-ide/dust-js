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
 * A one dimensional (slice) out of a {@link DustState} or {@link
 * DustStateTime} object. This is not really a new type, but just a
 * restriction on the existing `ndarray.NdArray` type that means that
 * TypeScript will expect exactly one index when using `get` and
 * `set`, as `ndarray` does not have a vector type.
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
     * vector of length `nState`. This is a copy of the underlying
     * data, decoupled from the state.
     */
    public asMatrix(): number[][] {
        const ret = [];
        for (let i = 0; i < this.nParticles; ++i) {
            ret.push(this.getParticle(i));
        }
        return ret;
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
