import { Random, RngState, RngStateBuiltin } from "@reside-ic/random";

import { base } from "./base";
import { Dust } from "./dust";
import {
    DustModel,
    DustModelInfo,
    DustModelConstructable,
    InternalStorage,
    UserType
} from "./model";
import { copyVector } from "./state";
import { combinations } from "./util";

// This interface exists to support testing in the R package and is
// quite annoying because it needs to support a model of running that
// we'll eventually remove as it's not very useful. However, we need
// to support the existing interface in order to complete the port of
// the js support before doing any refactor in odin so here we are!
export class PkgWrapper {
    private readonly Model: DustModelConstructable;
    private pars: UserType;
    private model: DustModel;
    private random: Random;

    constructor(Model: DustModelConstructable, pars: UserType,
                unusedUserAction: string, rng?: RngState) {
        this.Model = Model;
        this.pars = pars;
        this.random = new Random(rng || new RngStateBuiltin());
        this.model = new this.Model(base, pars, unusedUserAction);
    }

    public static random(rng: RngState) {
        return new Random(rng);
    }

    public setUser(pars: UserType, unusedUserAction: string) {
        this.pars = pars;
        this.model = new this.Model(base, pars, unusedUserAction);
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
        const dust = new Dust(this.Model, this.pars, nParticles, stepStart,
                              this.random);
        if (y !== null) {
            dust.setState([y]);
        }
        const state = dust.simulate(step, null);

        return {
            size: this.model.size(),
            y: Array.from(state.state.data as Float64Array)
        }
    }
}

export function variableNames(info: DustModelInfo): string[] {
    const ret: string[] = [];
    for (const el of info) {
        const { dim, name } = el;
        if (dim.length === 0) {
            ret.push(name);
        } else {
            ret.push(...combinations(dim).map(
                (i) => `${name}[${i.join(",")}]`));
        }
    }
    return ret;
}
