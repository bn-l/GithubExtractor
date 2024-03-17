import { Minipass } from "minipass";


export class RegexPipe extends Minipass<string, string> {
    
    public regex: RegExp;
    protected hasGroup: boolean;
    private buffer: string = "";

    constructor({ regex, hasGroup }: { regex: RegExp; hasGroup: boolean }) {
        super({ encoding: "utf8" });
        
        this.regex = regex; 
        this.hasGroup = hasGroup;
    }
    
    // Write is overloaded (for some reason) so cb needs to be any.
    //   Otherwise needs to override the overloads. What a mess.
    override write(chunk: string, callback: any) {
        
        this.buffer += chunk;
        let match: RegExpExecArray | null;
        let extracted = "";
        
        while (match = this.regex.exec(this.buffer)) {

            this.buffer = this.buffer.slice(this.regex.lastIndex);
            this.regex.lastIndex = 0;
            extracted += match[1] + "\n";
        }
        return super.write(extracted, callback);
    }

}
