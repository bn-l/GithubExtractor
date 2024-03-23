
import { defineConfig } from 'vitest/config'
export default defineConfig({
    test: {
        coverage: {
            reporter: ['html', "text", "lcovonly"],
            include: ["source/**", "!source/index.mts"],
        },
        include: [
            'test/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            '!test/fixtures/**'
        ],
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