// Everything here is based on odin-js, and later we'll harmonise with
// that and pull it into its own common lib.

/**
 * A key-value map of parameters to a model, currently restricted to
 * numbers. Later we'll expand this to more exotic types and harmonise
 * with odin.
 */
export type Pars = Record<string, number>;

export type InternalStorage = Record<string, number | number[]>;

/** Set a scalar parameter provided by the user. This function is a
 * stripped-down version of the similar function in odin, and will be
 * replaced there later.
 */
export function setParScalar(pars: ParsType, name: string,
                             internal: InternalStorage,
                             defaultValue: number | null) {
    const value = pars[name];
    if (value === undefined) {
        if (internal[name] !== undefined) {
            return;
        }
        if (defaultValue === null) {
            throw Error(`Expected a value for '${name}'`);
        }
        internal[name] = defaultValue;
    } else {
        internal[name] = value;
    }
}

export const pars = {
    setParScalar,
};
