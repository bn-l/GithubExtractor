
export class FileConflictError extends Error {
    public conflicts: string[] | undefined;

    constructor({ message, conflicts }: { message: string; conflicts?: string[] }) {
        super(message);

        this.conflicts = conflicts;
        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
        
        // Apparently necessary
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
