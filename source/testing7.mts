import { Minipass } from "minipass";
import fsm from "fs-minipass";


const readPipe = new fsm.ReadStream("./somefile.txt");

const src = new Minipass<string>({ encoding: "utf8" });

const tee1 = new Minipass<string>({ encoding: "utf8" });
tee1.on("data", console.log);

const tee2 = new Minipass<string>({ encoding: "utf8" });
tee2.on("data", text => console.log("and from number 2: ", text));

src.pipe(tee1);
src.pipe(tee2);

src.write("hello"); 
