
import { defineConfig } from 'vitest/config'
export default defineConfig({
    test: {
        coverage: {
            reporter: ['html', "text"],
            include: ["source/**"]
        },
        poolOptions: {
            threads: {
                minThreads: 1,
                maxThreads: 6,
                useAtomics: true
            }
        },
        pool: 'forks',
        // restoreMocks: true,
        // unstubGlobals: true,
        // unstubEnvs: true,
        chaiConfig: {
            includeStack: true
        },
    }
})