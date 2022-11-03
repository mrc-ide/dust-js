import {
    Batch,
    BatchPars,
    InterpolatedSolution,
    SeriesSet,
    Times,
    TimeMode
} from "@reside-ic/odinjs";

import { Dust } from "./dust";
import type { DustModel, DustModelInfo, DustModelConstructable, UserType } from "./model";
import type { DustStateTime } from "./state-time";
import {
    applyArray,
    findClosest,
    isEqualArray,
    mean,
    seq,
    seqBy
} from "./util";

/**
 * Convert a slice of a series at a single time point into a single
 * summary value
 */
export interface SummaryRule {
    /** Description of this summary, should use an initial capital */
    description: string;
    /** The actual transformation function */
    summary: (x: number[]) => number;
}

/**
 * A single series, most likely within a {@link DiscreteSeriesSet}
 */
export interface DiscreteSeriesValues {
    /**
     * The description of the series. There are a couple of special values:
     *
     * * Individual: an individual stochastic trace
     * * Deterministic: A single trace for where no variation was
     *   observed across all replicates (particles)
     *
     * Otherwise, the description is derived from the summary
     * function.
     */
    description: string;
    /** The name of the series */
    name: string;
    /** The values of the variable within the series */
    y: number[];
}

/**
 * Interface for objects returned by {@link wodinRunDiscrete}. This
 * represents some number of model variables, each of which may have
 * multiple traces (several stochastic realisations, followed by a
 * mean) or be a single trace where there was no observed differences
 * between particles.
 */
export interface DiscreteSeriesSet {
    /**
     * Common domain (typically time) for the solution
     */
    x: number[];
    /**
     * The individual seriess. These have predictable ordering:
     *
     * * Traces corresponding to a single logical model variable will
     *   be adjacent to each other, and these will be in the same
     *   order as the model metadata.
     * * Individual traces (which have a `description` value of
     *   `"Individual"` will always appear before any summary traces,
     *   but are omitted in the case where all individual traces are
     *   identical.
     */
    values: DiscreteSeriesValues[];
}

interface DiscreteSolution {
    info: DustModelInfo;
    state: DustStateTime;
    times: number[];
}

/**
 * The discrete-time version of odin-js's `InterpolatedSolution`; the
 * solution is not interpolated here, but we filter times based on the
 * requested times and the times available from the simulation.
 */
export type FilteredDiscreteSolution = (times: Times) => DiscreteSeriesSet;

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
 * @param nParticles The number of independent particles (replicates) to run
 */
export function wodinRunDiscrete(Model: DustModelConstructable,
                                 pars: UserType, timeStart: number, timeEnd: number,
                                 dt: number, nParticles: number,
                                 summary?: SummaryRule[]): FilteredDiscreteSolution {
    if (!summary) {
        summary = [{ description: "Mean", summary: mean }];
    }
    const solution = runModelDiscrete(Model, pars, timeStart, timeEnd, dt, nParticles);
    return filterSolution(tidyDiscreteSolution(solution, summary));
}

export function tidyDiscreteSolution(solution: DiscreteSolution, summary: SummaryRule[]): DiscreteSeriesSet {
    const names: string[] = [];
    const x = solution.times;
    const y: number[][] = [];
    const values = [] as DiscreteSeriesValues[];
    solution.info.forEach((el) => {
        const sol = tidyDiscreteSolutionVariable(el.name, solution, summary);
        values.push(...sol);
    });

    return { x, values };
}

export function filterIndex(t: number[], times: Times): number[] {
    if (times.mode === TimeMode.Grid) {
        const i0 = findClosest(times.tStart, t);
        const i1 = findClosest(times.tEnd, t);
        const by = Math.max(1, Math.ceil((i1 - i0) / times.nPoints));
        return seqBy(i0, i1, by);
    } else {
        return times.times.map((el) => findClosest(el, t));
    }
}

export function filterSolution(solution: DiscreteSeriesSet): FilteredDiscreteSolution {
    return (times: Times) => {
        const index = filterIndex(solution.x, times);
        const filter = (x: number[]) => index.map((i) => x[i]);
        return {
            x: filter(solution.x),
            values: solution.values.map((el) => ({ ...el, y: filter(el.y) })),
        };
    }
}

export function tidyDiscreteSolutionVariable(name: string, solution: DiscreteSolution,
                                             summary: SummaryRule[]): DiscreteSeriesValues[] {
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
        const values = y.map((s) => ({
            description: "Individual",
            name,
            y: s
        }));
        summary.map((el) => {
            values.push({
                description: el.description,
                name,
                y: applyArray(y, el.summary)
            });
        });
        return values;
    } else {
        return [{
            description: "Deterministic",
            name,
            y: first
        }]
    }
}

/**
 * Run a series of runs of a discrete-time model, returning a set of
 * solutions.
 *
 * @param Model The model constructor
 *
 * @param pars Parameters of the model, and information about the one
 * to vary. Most easily generated with odin-js's `batchParsRange` or
 * `batchParsDisplace`
 *
 * @param timeStart Start of the simulation (often 0)
 *
 * @param timeEnd End of the simulation (must be greater than `timeStart`)
 *
 * @param dt The size of each step
 *
 * @param nParticles The number of independent particles (replicates) to run
 */
export function batchRunDiscrete(Model: DustModelConstructable, pars: BatchPars,
                                 timeStart: number, timeEnd: number,
                                 dt: number, nParticles: number,
                                 summary?: SummaryRule[]): Batch {
    const run = (p: UserType, t0: number, t1: number) =>
        centralOnly(wodinRunDiscrete(Model, p, t0, t1, dt, nParticles, summary));
    return new Batch(run, pars, timeStart, timeEnd);
}

export function centralOnly(solution: FilteredDiscreteSolution): InterpolatedSolution {
    return (times: Times) => filterToCentralOnly(solution(times));
}

export function filterToCentralOnly(result: DiscreteSeriesSet): SeriesSet {
    const values = result.values
        .filter((el: DiscreteSeriesValues) => el.description !== "Individual");
    return {
        x: result.x,
        values
    };
}
