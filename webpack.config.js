export default (env, argv) => {
    const isProd = argv.mode === 'production'

    return {
        watch: !isProd,
        watchOptions: {
            ignored: /node_modules/
        },
        entry: './src/index.ts',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js']
        },
        output: {
            path: new URL('dist', import.meta.url).pathname,
            filename: `index.js`,
            library: {
                type: 'module'
            }
        },
        experiments: {
            outputModule: true
        }
    }
}
