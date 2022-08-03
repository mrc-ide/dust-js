import {Random} from "@reside-ic/random";

import type {DustModel, DustModelConstructable, DustModelInfo} from "./model";

export class Particle {
    /** The step (in time) that the particle is currently at */
    public step: number;

    /** The size of the particle state - this cannot be modified after
     * creation
     */
    public readonly size: number;

    private _model: DustModel;
    private _y: number[];
    private _yNext: number[];

    /**
     * Construct a particle
     *
     * @param model An initialised model - note that unlike the C++
     * version of dust, all particles share the same initialised model
     * as they do not run in parallel.
     *
     * @param step The step to start the particle at
     *
     * @param state Optional vector of state; if given then this is
     * the initial state for the particle. Otherwise the state comes
     * from the models `initial` method (see {@link DustModel})
     */
    constructor(model: DustModel, step: number, state?: readonly number[]) {
        this._model = model;
        this.step = step;
        this.size = model.size();
        if (state === undefined) {
            this._y = model.initial(this.step);
        } else {
            this._y = [...state];
        }
        this._yNext = Array(this.size).fill(0);
    }

    /**
     * Model information, about ordering of variables, parameters,
     * etc.
     */
    public info(): DustModelInfo {
        return this._model.info();
    }

    /**
     * Run a particle up to the end of `stepEnd`
     *
     * @param stepEnd Step to run the particle to the end of
     *
     * @param random The random number state to use for any stochastic
     * draws
     */
    public run(stepEnd: number, random: Random): void {
        while (this.step < stepEnd) {
            this._model.update(this.step++, this._y, this._yNext, random);
            this.swap();
        }
    }

    /**
     * Return current particle state
     */
    public state(): readonly number[] {
        return this._y;
    }

    /**
     * Set particle state
     *
     * @param state New state, must be of length `size`
     */
    public setState(state: number[]): void {
        for (let i = 0; i < state.length; ++i) {
            this._y[i] = state[i];
        }
    }

    /**
     * Swap the model state with its internal next state. This is
     * designed for use by {@link Dust} and not users in general!
     */
    public swap(): void {
        [this._y, this._yNext] = [this._yNext, this._y];
    }
}
