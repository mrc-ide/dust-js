import { BatchPars, Extremes } from "@reside-ic/odinjs";

import { DustModelConstructable, UserType } from "./model";
import { wodinRunDiscrete, DiscreteSeriesMode, DiscreteSeriesSet, DiscreteSeriesValues } from "./wodin";

// TODO: pull from odin after upgrade
export interface BatchError {
    /** The failed parameter value */
    value: number;
    /** The error */
    error: string;
}

// TODO: pull from odin after upgrade
export interface SeriesSet {
    x: number[];
    values: SeriesSetValues[];
}

export interface SeriesSetValues {
    name: string;
    y: number[];
}


// TODO: this is also in odin, but might be worth keeping, depends how
// we update the batch code really as the running can certainly be
// done generically.
export function updatePars(base: UserType, name: string, value: number) {
    const ret = { ...base };
    ret[name] = value;
    return ret;
}

export function batchRunDiscrete(Model: DustModelConstructable, pars: BatchPars,
                                 tStart: number, tEnd: number,
                                 dt: number, nParticles: number) {
    return new Batch(Model, pars, tStart, tEnd, dt, nParticles);
}

// This can all be done generically if we take
//
// number => T function for running solution
//
// The issue is then how we do the valueAtTime bit, which requires a
// bit of thought, and findExtremes which also needs things gridded
// out
//
// For valueAtTime we do (number) => SeriesSet, that's quite annoying
//
// For the extremes we need to do a bit of faff too, probably this is
// quite different really.
export class Batch {
    public readonly pars: BatchPars;
    public readonly tStart: number;
    public readonly tEnd: number;
    public readonly solutions: any[];
    public readonly errors: BatchError[];
    private _extremes?: Extremes<SeriesSet>;

    constructor(Model: DustModelConstructable, pars: BatchPars,
                tStart: number, tEnd: number,
                dt: number, nParticles: number) {
        this.tStart = tStart;
        this.tEnd = tEnd;

        const solutions = [] as DiscreteSeriesSet[];
        const errors = [] as BatchError[];
        const values = [] as number[];

        // For a generic approach, we only need to provide something
        // that does the running here given a single parameter and
        // we're ok.
        pars.values.forEach((v: number) => {
            const p = updatePars(pars.base, pars.name, v);
            try {
                const sol = wodinRunDiscrete(Model, p, tStart, tEnd, dt, nParticles);
                solutions.push(filterSolution(sol));
                values.push(v);
            } catch (e: any) {
                errors.push({value: v, error: (e as Error).message});
            }
        });

        // We need to think about this error, though it should not
        // come out that often...
        if (solutions.length === 0) {
            throw Error(`All solutions failed; first error: ${errors[0].error}`);
        }

        // We actually only use the value here, so could just save
        // that, and not the rest, really.
        this.pars = {...pars, values};
        this.solutions = solutions;
        this.errors = errors;
    }

    public valueAtTime(time: number): SeriesSet {
        const x = this.pars.values;
        const sol = this.solutions;
        const idxTime = findClosest(time, sol[0].x);
        const extractSeries = (idxSeries: number) => ({
            name: sol[0].values[idxSeries].name,
            y: sol.map((r) => r.values[idxSeries].y[idxTime]),
        });
        const values = sol[0].values.map((_: any, idxSeries: number) => extractSeries(idxSeries));
        return { values, x };
    }

    public extreme(name: keyof Extremes<SeriesSet>): SeriesSet {
        return this.findExtremes()[name];
    }

    public findExtremes() {
        if (this._extremes === undefined) {
            const result = this.solutions;
            const t = result[0].x;
            const names = result[0].values.map((s: DiscreteSeriesValues) => s.name);
            const extremes = loop(names.length, (idx: number) =>
                                  result.map((s) => findExtremes(t, s.values[idx].y)));
            const x = this.pars.values;
            this._extremes = {
                tMax: extractExtremes("tMax", names, x, extremes),
                tMin: extractExtremes("tMin", names, x, extremes),
                yMax: extractExtremes("yMax", names, x, extremes),
                yMin: extractExtremes("yMin", names, x, extremes),
            };
        }
        return this._extremes;
    }
}

export function filterSolution(solution: DiscreteSeriesSet): DiscreteSeriesSet {
    return {
        x: solution.x,
        values: solution.values.filter((el) => el.mode !== DiscreteSeriesMode.Individual)
    };
}

export function findClosest(x: number, arr: number[]) {
    const i = arr.findIndex((el) => el >= x);
    if (arr[i] === x || i === 0) {
        return i;
    }
    const xi = arr[i - 1];
    const xj = arr[i];
    return (x - xi) < (xj - x) ? i - 1 : i;
}

// copied over from odin-js
export function whichMin(x: number[]) {
    let idx = -1;
    let min = Infinity;
    for (let i = 0; i < x.length; ++i) {
        if (x[i] < min) {
            idx = i;
            min = x[i];
        }
    }
    return idx;
}

export function whichMax(x: number[]) {
    let idx = -1;
    let max = -Infinity;
    for (let i = 0; i < x.length; ++i) {
        if (x[i] > max) {
            idx = i;
            max = x[i];
        }
    }
    return idx;
}

export function loop<T>(n: number, f: (i: number) => T): T[] {
    const ret = [];
    for (let i = 0; i < n; ++i) {
        ret.push(f(i));
    }
    return ret;
}

function findExtremes(t: number[], y: number[]): Extremes<number> {
    const idxMin = whichMin(y);
    const idxMax = whichMax(y);
    const tMin = t[idxMin];
    const tMax = t[idxMax];
    const yMin = y[idxMin];
    const yMax = y[idxMax];
    return {tMax, tMin, yMax, yMin};
}

function extractExtremes(name: keyof Extremes<number>,
                         names: string[],
                         x: number[],
                         extremes: Extremes<number>[][]): SeriesSet {
    const values = loop(names.length, (idx) =>
                        ({name: names[idx], y: extremes[idx].map((el) => el[name])}));
    return { x, values };
}
