
import "./shimSet.mjs";


const x = new Set([1, 2, 3, 4]);
const y = new Set([1]);

x.difference(y);

console.log(x.difference(y));
