import { someFunc } from "../source/somefunc.js";
import t from "tap";

t.test("someFunc: returns the sum of the two numbers", async t => {
    t.equal(someFunc(1, 2), 3);
});