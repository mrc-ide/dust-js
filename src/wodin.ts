import { Dust } from "./dust";
import type { DustModel, DustModelInfo, DustModelConstructable, UserType } from "./model";
import type { DustStateTime } from "./state-time";
import { isEqualArray, meanArray, seq } from "./util";

/**
 * Describes the role that each series plays
 */
export enum DiscreteSeriesMode {
    /** An individual stochastic trace */
    Individual = "Individual",
    /** The mean over several Individual trace */
    Mean = "Mean",
    /** A single trace for where no variation was observed across all replicates (particles) */
    Deterministic = "Deterministic"
}

/**
 * Interface for objects returned by {@link wodinRunDiscrete}. This
 * represents some number of model variables, each of which may
 */
export interface DiscreteSeriesSet {
    /** Names of each trace represented in `y`; these will be repeated
     * wherever stochastic traces are found
     */
    names: string[];
    /**
     * Common domain (typically time) for the solution
     */
    x: number[];
    /**
     * An array of arrays of variables - the element `y[i][j]`
     * represents the `i`th trace at the `j` time; there `y.length`
     * will be the same as `names.length` and `mode.length` (i.e., one
     * trace per series), and `y[i].length` will be the same as
     * `x.length` (i.e., each series as one point per step)
     */
    y: number[][];
    /**
     * The mode that each trace plays. These have some predictable
     * behaviours:
     *
     * * `Individual` traces will always appear before the single
     *   `Mean` trace
     * * For a given value in `names`, there will either be at least
     *   one `Individual` trace, followed by exactly one `Mean` trace
     *   or there will be a single `Deterministic` trace
     */
    mode: DiscreteSeriesMode[];
}

interface DiscreteSolution {
    info: DustModelInfo;
    state: DustStateTime;
    times: number[];
}

export function runModelDiscrete(Model: DustModelConstructable,
                                 pars: UserType, timeStart: number,
                                 timeEnd: number, dt: number,
                                 nParticles: number): DiscreteSolution {
    const stepStart = Math.floor(timeStart / dt);
    const stepEnd = Math.ceil(timeEnd / dt);
    const d = new Dust(Model, pars, nParticles, stepStart);
    const info = d.info();

    const steps = seq(stepStart, stepEnd); // inclusive
    const times = steps.map((s) => s * dt);
    const state = d.simulate(steps, null);
    return { info, state, times };
}

/**
 * Run a discrete time model for wodin.  The basic idea here is that
 * we will run some number of replicate simulations forward in time
 * and immediately summarise these in a way that Wodin can use.
 *
 * There is some sleight of hand here with time that currently copies
 * the behaviour from the shiny app. The discrete time models don't
 * really have a concept of time, they just have "steps", and there is
 * a time variable (`time` in most of the short course/MSc models)
 * which is defined as `time = step * dt`. So if we know what `dt` is
 * then we can work directly in terms of "time" in the interface and
 * obscure steps a bit. So here you need to provide `timeStart`,
 * `timeEnd` and `dt` from which we can arrange a suitable range of
 * steps to run the model, then return things in terms of this scaled
 * time.  For example, if `dt` was 0.1 and you ran the model from time
 * 0 to 50 we would return 501 points (steps 0, 1, ..., 499, 500)
 * corresponding to times 0.0, 0.1, 49.9, 50.0. If `dt` is not the
 * inverse of a natural number this will behave poorly but practically
 * that's not a big deal because the course organisers bake dt into
 * the fixed code.
 *
 * @param Model The model constructor
 *
 * @param pars Parameters to set into the model on construction
 *
 * @param timeStart The starting step (often 0)
 *
 * @param timeEnd The finishing step, greater than zero
 *
 * @param dt The size of each step
 *
 * @param nParticles The number of independent particles to run
 */
export function wodinRunDiscrete(Model: DustModelConstructable,
                                 pars: UserType, timeStart: number, timeEnd: number,
                                 dt: number, nParticles: number): DiscreteSeriesSet {
    const solution = runModelDiscrete(Model, pars, timeStart, timeEnd, dt, nParticles);
    return tidyDiscreteSolution(solution);
}

export function tidyDiscreteSolution(solution: DiscreteSolution): DiscreteSeriesSet {
    const names: string[] = [];
    const x = solution.times;
    const y: number[][] = [];
    const mode: DiscreteSeriesMode[] = [];

    solution.info.forEach((el) => {
        const sol = tidyDiscreteSolution1(el.name, solution);
        names.push(...sol.names);
        y.push(...sol.y);
        mode.push(...sol.mode);
    });

    return { mode, names, x, y };
}

export function tidyDiscreteSolution1(name: string, solution: DiscreteSolution) {
    // TODO: if we have any array variables, this is going to need
    // some work, but that's the case all through the package and
    // currently prevented by mrc-3468.
    //
    // At this point we'll want to map things to nice names, but also
    // group them into logical sets (so S[1], S[2], ..., S[n] belong
    // to some group S)
    //
    // In the meantime when we can assume that all traces are scalar
    // variables, the lookup here is simple and we can just process
    // fairly straightforwardly.
    const i = solution.info.map((el) => el.name).indexOf(name);
    const state = solution.state;
    const first = state.getTrace(i, 0);

    let isStochastic = false;
    const y: number[][] = [];
    for (let j = 0; j < state.nParticles; ++j) {
        const yij = state.getTrace(i, j);
        y.push(yij);
        if (!isStochastic && j > 1 && !isEqualArray(yij, first)) {
            isStochastic = true;
        }
    }

    if (isStochastic) {
        const mode = Array(y.length).fill(DiscreteSeriesMode.Individual);
        y.push(meanArray(y));
        mode.push(DiscreteSeriesMode.Mean);
        const names = Array(y.length).fill(name);
        return { mode, names, y };
    } else {
        return {
            mode: [DiscreteSeriesMode.Deterministic],
            names: [name],
            y: [first]
        }
    }
}
