const esbuild = require('esbuild');

const production = process.argv.includes('--mode=production');

const buildOptions = {
    bundle: true,
    minify: production,
    sourcemap: !production,
    logLevel: 'info',
};

async function build() {
    try {
        await esbuild.build({
            ...buildOptions,
            entryPoints: ['src/client/client.ts'],
            outfile: 'dist/client.js',
            format: 'iife',
            platform: 'browser',
            target: 'es2017',
        });

        await esbuild.build({
            ...buildOptions,
            entryPoints: ['src/server/server.ts'],
            outfile: 'dist/server.js',
            format: 'cjs',
            platform: 'node',
            target: 'node16',
            banner: {
                js: `const path = require('path');
                if (typeof require !== 'undefined' && !require.main) {
                    require.main = { filename: path.join(process.cwd(), 'dist/server.js') };
                }
                global.rootPath = process.cwd();
                var __dirname = process.cwd();`,
            },
        });

        console.log(' Build erfolgreich abgeschlossen!');

    } catch (e) {
        console.error(' Build fehlgeschlagen!', e);
        process.exit(1);
    }
}

build();