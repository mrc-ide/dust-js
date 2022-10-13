import type { Random } from "@reside-ic/random";

import type { base, BaseType } from "../src/base";
import type { DustModel, DustModelInfo, InternalStorage, UserType } from "../src/model";

// In contrast with the equivalent models in odin-js I'm leaving these
// as TypeScript (not JS) for now to help get types right. That does
// mean that there's a bit of a fight with extracting things from the
// InternalStorage type.
export class Walk implements DustModel {
    private readonly internal: InternalStorage;

    constructor(base: BaseType, pars: UserType) {
        this.internal = {};
        base.user.setUserScalar(pars, "n", this.internal, 1,
                                -Infinity, Infinity, false);
        base.user.setUserScalar(pars, "sd", this.internal, 1,
                                -Infinity, Infinity, false);
    }

    public size(): number {
        return this.internal.n as number;
    }

    public info(): DustModelInfo {
        const n = this.internal.n as number;
        return [{dim: [n], length: n, name: "x"}];
    }

    public initial(step: number): number[] {
        return Array(this.internal.n as  number).fill(step);
    }

    public update(step: number, y: readonly number[], yNext: number[], random: Random): void {
        const n = this.internal.n as number;
        const sd = this.internal.sd as number;
        for (let i = 0; i < n; ++i) {
            yNext[i] = random.normal(y[i], sd);
        }
    }

    public getInternal(): InternalStorage {
        return this.internal;
    }
}
