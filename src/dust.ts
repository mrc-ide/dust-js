import { Random, RngState } from "@reside-ic/random";

import { base } from "./base";
import type { DustModel, DustModelInfo, DustModelConstructable } from "./model";
import { Pars } from "./pars";
import { Particle } from "./particle";
import { DustState, dustState } from "./state";
import { DustStateTime, dustStateTime } from "./state-time";

/**
 * Dust models
 */
export class Dust {
    private readonly _Model: DustModelConstructable;
    private readonly _particles: Particle[];
    private readonly _random: Random;

    /**
     * @param Model A constructor for the model to use in the simulation
     *
     * @param pars Initial parameters to use with the model
     *
     * @param nParticles Number of particles to use in the simulation
     * - can't be changed after construction.
     *
     * @param step Initial step
     *
     * @param random The random state
     */
    constructor(Model: DustModelConstructable, pars: Pars, nParticles: number,
                step: number, random: Random) {
        if (nParticles <= 0) {
            throw Error("Expected at least one particle");
        }
        this._Model = Model;
        this._particles = [];
        this._random = random;

        // NOTE: Here, we construct the model just once per dust
        // object and then use exactly the same model object
        // (including temporary internal storage) across all particles
        // in object. This is in contrast with the approach taken in
        // the C++ code where we kept separate copies so that they
        // could be run in parallel. If we parallelise this with web
        // workers we might need to revisit this approach, but the API
        // there looks nothing like OpenMP and this would probably
        // still be ok, once per worker.
        const model = new Model(base, pars);
        for (let i = 0; i < nParticles; ++i) {
            this._particles.push(new Particle(model, step));
        }
    }

    /**
     * Returns the number of state elements per particle
     */
    public nState(): number {
        return this._particles[0].size;
    }

    /**
     * Returns the number of particles
     */
    public nParticles(): number {
        return this._particles.length;
    }

    /**
     * The current step
     */
    public step(): number {
        return this._particles[0].step;
    }

    /**
     * Returns information about how the state is packed. This is
     * useful for computing indexes and extracting state.
     */
    public info(): DustModelInfo {
        return this._particles[0].info();
    }

    /**
     * Set new parameters into the model
     *
     * @param pars: New parameters
     *
     * @param setInitialState If `true`, then changing the parameters
     * also updates the initial conditions to use those from the
     * model's `initial()` method. This uses the current step of the
     * model, so you may want to use {@link Dust.setStep} first.
     */
    public setPars(pars: Pars, setInitialState: boolean): void {
        const step = this.step();
        const nState = this.nState();
        const model = new this._Model(base, pars);
        if (model.size() !== this.nState()) {
            throw Error(`Particle produced unexpected state size`);
        }
        for (let i = 0; i < this._particles.length; ++i) {
            const state =
                setInitialState ? undefined : this._particles[i].state();
            this._particles[i] = new Particle(model, step, state);
        }
    }

    /**
     * Change the step in the model, without updating state
     *
     * @param step New step
     */
    public setStep(step: number): void {
        this._particles.forEach((p) => {
            p.step = step;
        });
    }

    /**
     * Change the model state
     *
     * @param state A 2d-matrix of state; this inteface may change.
     */
    public setState(state: number[][]): void {
        this.checkState(state);
        for (let i = 0; i < this.nParticles(); ++i) {
            this._particles[i].setState(state[i]);
        }
    }

    /**
     * Run the model up to some step
     *
     * @param stepEnd The step to run the model to
     */
    public run(stepEnd: number): void {
        this._particles.forEach((p: Particle) => p.run(stepEnd, this._random));
    }

    /**
     * Run the model and collect state at a series of times
     *
     * @param stepEnd An array of steps to collect state at, must be
     * increasing. The model will stop running at the final element.
     *
     * @param index An index to use to filter state, or `null` to
     * return the full state, see {@link Dust.state}
     */
    public simulate(stepEnd: number[], index: number[] | null): DustStateTime {
        const nState = index === null ? this.nState() : index.length;
        const nParticles = this.nParticles();
        const nTime = stepEnd.length;
        const state = dustStateTime(nState, nParticles, nTime);
        for (let iTime = 0; iTime < nTime; ++iTime) {
            this.run(stepEnd[iTime]);
            for (let iParticle = 0; iParticle < nParticles; ++iParticle) {
                const v = state.viewParticle(iParticle, iTime);
                this._particles[iParticle].copyState(v, index);
            }
        }
        return state;
    }

    /**
     * Extract state from the model
     *
     * @param index An index to use to filter the model state. If
     * given as a numeric array, then we extract `index.length` states
     * from the model, with the `i`th extracted state coming from the
     * models's state `index[i]`. If `null`, then the full model state
     * is copied out.
     */
    public state(index: number[] | null): DustState {
        const nState = index === null ? this.nState() : index.length;
        const nParticles = this.nParticles();
        const state = dustState(nState, nParticles);
        for (let iParticle = 0; iParticle < nParticles; ++iParticle) {
            const v = state.viewParticle(iParticle);
            this._particles[iParticle].copyState(v, index);
        }
        return state;
    }

    private checkState(state: number[][]) {
        if (state.length !== this.nParticles()) {
            throw Error(`Invalid length state, expected ${this.nParticles()}` +
                        ` but given ${state.length}`);
        }
        for (let i = 0; i < state.length; ++i) {
            if (state[i].length !== this.nState()) {
                throw Error(`Invalid length state for particle ${i},` +
                            ` expected ${this.nState()}` +
                            ` but given ${state[i].length}`);
            }
        }
    }
};
