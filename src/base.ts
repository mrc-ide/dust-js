import { base as baseOdin } from "@reside-ic/odinjs";

const { maths, user, interpolate } = baseOdin;

/**
 * Support code available during model construction and update,
 * (eventually) mirroring the interface in odin-js.
 */
export const base = { maths, user, interpolate };

/**
 * A singleton type (see {@link base}) with support code used in the model
 */
export type BaseType = typeof base;
