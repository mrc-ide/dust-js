import { Random, RngState, RngStateBuiltin } from "@reside-ic/random";

import { base } from "./base";
import { Dust } from "./dust";
import { DustModel, DustModelInfo, DustModelConstructable } from "./model";
import { InternalStorage, Pars } from "./pars";
import { copyVector } from "./state";
import { combinations } from "./util";

// This interface exists to support testing in the R package and is
// quite annoying because it needs to support a model of running that
// we'll eventually remove as it's not very useful. However, we need
// to support the existing interface in order to complete the port of
// the js support before doing any refactor in odin so here we are!
//
// The biggest sources of difference are:
//
// * how we handle metadata
// * how we handle updating of parameters
export class PkgWrapper {
    private readonly Model: DustModelConstructable;
    private pars: Pars;
    private model: DustModel;
    private random: Random;

    constructor(Model: DustModelConstructable, pars: Pars, random?: Random) {
        this.Model = Model;
        this.pars = pars;
        this.random = random || new Random(new RngStateBuiltin());
        this.model = new this.Model(base, pars);
    }

    public setUser(pars: Pars) {
        this.pars = pars;
        this.model = new this.Model(base, pars);
    }

    public initial(step: number): number[] {
        return this.model.initial(step);
    }

    public update(step: number, y: number[]): number[] {
        const yNext = Array(y.length).fill(0);
        this.model.update(step, y, yNext, this.random);
        return yNext;
    }

    public getInternal(): InternalStorage {
        return this.model.getInternal();
    }

    public getMetadata() {
        // here, we want metadata in the format the the odin R package
        // expects it, which is a bit peculiar.
        const info = this.model.info();
        return {
            info,
            names: variableNames(info),
            size: this.model.size(),
        };
    }

    public run(step: number[], y: number[] | null) {
        const stepStart = step[0];
        const nParticles = 1;
        const dust = new Dust(this.Model, this.pars, nParticles, stepStart, this.random);
        if (y !== null) {
            dust.setState([y]);
        }
        const state = dust.simulate(step, null);
        this.model = dust.model();

        return {
            size: this.model.size(),
            y: Array.from(state.state.data as Float64Array)
        }
    }
}

export function variableNames(info: DustModelInfo): string[] {
    const ret: string[] = [];
    for (let el of info) {
        const { dim, name } = el;
        if (dim.length === 0) {
            ret.push(name);
        } else {
            ret.push(...combinations(dim).map((i) => `${name}[${i.join(",")}]`));
        }
    }
    return ret;
}
