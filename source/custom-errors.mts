
export class FileConflictError extends Error {
    public conflicts: string[];
    public override name = "FileConflictError";
    

    constructor({ message, conflicts }: { message?: string; conflicts: string[] }) {
        super(message ?? "Some files are in conflict and will get overwritten if this proceeds");

        this.conflicts = conflicts;

        Error.captureStackTrace(this, this.constructor);
        
        // Apparently necessary
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

