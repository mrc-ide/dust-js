import { Random } from "@reside-ic/random";

import { BaseType } from "./base";
import { InternalStorage, Pars } from "./pars";

/**
 * Constructor for a {@link DustModel}
 *
 * @param base The singleton base object
 *
 * @param pars Parameters to pass to the model
 *
 */
export type DustModelConstructable = new(base: BaseType, pars: Pars) => DustModel;

/**
 * Information returned by an initialised model about itself
 */
export type DustModelInfo = DustModelVariable[];

/**
 * Information about a single variable within a model, typically found
 * within {@link DustModelInfo}
 */
export interface DustModelVariable {
    /**
     * Dimensions of the variable.
     * * empty vector - a scalar
     * * length-1 vector - length of a vector
     * * length-2 vector - number of rows and columns of a matrix
     * * length-n vector - size of each dimension
     *
     * Note that as the product of an empty vector is 1,
     * so the product of `dim` is always equal to `length`
     */
    dim: number[];

    /**
     * Length of the variable - if the variable represents a vector or
     * multidimensional array, then this is the length over all
     * dimensions. Scalars have length 1, so that the sum of all
     * length elements within an {@link DustModelInfo} array will
     * equal the sum of the products of all `dim` elements.
     */
    length: number;

    /** Name of the variable */
    name: string;
}

/**
 * The interface that dust models conform to
 *
 */
export interface DustModel {
    /**
     * Compute initial conditions
     * @param step Step to compute initial conditions at
     */
    initial(step: number): number[];
    /**
     * Length of the state variables for this model
     */
    size(): number;
    /**
     * Return information about how variables are packed into the
     * state vector
     */
    info(): DustModelInfo;
    /**
     * The workhorse function, defining how the state is transformed
     * at step `step` from `y` to `yNext`
     *
     * @param step The step number
     *
     * @param y The initial state
     *
     * @param yNext The state at the end of the step, will be updated
     * in-place
     *
     * @param random The random state, used for any stochastic updates
     */
    update(step: number, y: readonly number[], yNext: number[], random: Random): void;

    /**
     * Return the state of the internal storage - odin uses this for
     * debugging and testing.
     */
    getInternal(): InternalStorage;
}
