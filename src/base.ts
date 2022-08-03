import { pars } from "./pars";

/**
 * Support code available during model construction and update,
 * (eventually) mirroring the interface in odin-js.
 */
export const base = { pars };

/**
 * A singleton type (see {@link base}) with support code used in the model
 */
export type BaseType = typeof base;
