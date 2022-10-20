import {versions} from "../src/versions";

test("Can report versions", () => {
    const res = versions();
    expect(res.dust).toBeDefined();
    expect(res.random).toBeDefined();
    expect(res.odinjs).toBeDefined();
});
