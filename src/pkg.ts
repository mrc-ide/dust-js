import { Random, RngState, RngStateBuiltin } from "@reside-ic/random";

import { base } from "./base";
import { Dust } from "./dust";
import { DustModel, DustModelInfo, DustModelConstructable } from "./model";
import { InternalStorage, Pars } from "./pars";
import { copyVector } from "./state";

// This interface exists to support testing in the R package and is
// quite annoying because it needs to support a model of running that
// we'll eventually remove as it's not very useful. However, we need
// to support the existing interface in order to complete the port of
// the js support before doing any refactor in odin so here we are!
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

    public update(step: number, y: number[]) {
        const yNext = [...y];
        this.model.update(step, y, yNext, this.random);
        return yNext;
    }

    public getInternal(): any {
        return this.model.getInternal();
    }

    public getMetadata(): DustModelInfo {
        return this.model.info();
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
            info: this.model.info(),
            y: Array.from(state.state.data as Float64Array)
        }
    }
}
