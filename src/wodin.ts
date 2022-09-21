import { Dust } from "./dust";
import type { DustModel, DustModelInfo, DustModelConstructable } from "./model";
import type { Pars } from "./pars";
import type { DustStateTime } from "./state-time";
import { isEqualArray, meanArray, seq } from "./util";

// Support code for wodin. This will likely move into its own package,
// but I am having a bit of a pain with sorting out dependencies and
// the two parts are extremely linked at present.

// The basic idea here is that we will run some number of replicate
// simulations forward in time and immediately summarise these in a
// way that wodin can use.

// Once that's working, then we can also sort things out to work
// reasonably well with a package-runner for odin's internal tests,
// which will close out the odin feature branch at last.
export enum DiscreteSeriesMode {
    Individual = "Individual",
    Mean = "Mean",
    Deterministic = "Deterministic"
}

export interface DiscreteSeriesSet {
    names: string[];
    x: number[];
    y: number[][];
    mode: DiscreteSeriesMode[];
}

export interface DiscreteSolution {
    info: DustModelInfo;
    state: DustStateTime
}

export function runModelDiscrete(Model: DustModelConstructable,
                                 pars: Pars, stepStart: number,
                                 stepEnd: number,
                                 nParticles: number): DiscreteSolution {
    const d = new Dust(Model, pars, nParticles, stepStart);
    const info = d.info();
    const steps = seq(stepStart, stepEnd); // inclusive
    const state = d.simulate(steps, null);
    return { info, state };
}

export function wodinRunDiscrete(Model: DustModelConstructable,
                                 pars: Pars, stepStart: number,
                                 stepEnd: number, nParticles: number): DiscreteSeriesSet {
    const solution = runModelDiscrete(Model, pars, stepStart, stepEnd, nParticles);
    return tidyDiscreteSolution(solution);
}

export function tidyDiscreteSolution(solution: DiscreteSolution): DiscreteSeriesSet {
    const names: string[] = [];
    const x = solution.state.steps;
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
