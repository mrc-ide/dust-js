import { setParScalar, InternalStorage, Pars } from "../src/pars";

describe("setParScalar", () => {
    const pars = { a: 1, b: 2.5, c: 3 };
    it("Can retrieve a user value", () => {
        const internal = {} as InternalStorage;
        setParScalar(pars, "a", internal, null);
        expect(internal["a"]).toEqual(1);
    });

    it("Can fall back on default value, erroring if unavailable", () => {
        const internal = {} as InternalStorage;
        expect(() => setParScalar(pars, "d", internal, null))
            .toThrow("Expected a value for 'd'");
        setParScalar(pars, "d", internal, 1);
        expect(internal.d).toEqual(1);
    });

    it("Can fall back on value within internal if missing", () => {
        const internal = {d: 10} as InternalStorage;
        setParScalar(pars, "d", internal, 1);
        expect(internal["d"]).toEqual(10);
    });
});
