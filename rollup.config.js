import lwcCompiler from '@lwc/rollup-plugin';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';

export default {
    input: {
        tradingCard: './src/trading-card.js',
        hitCounter: './src/hit-counter.js',
        webring: './src/webring.js'
    },
    output: [
        {
            dir: './dist',
            format: 'esm'
        }
    ],
    plugins: [
        resolve({ browser: true }),
        lwcCompiler({
            rootDir: './src/client/modules'
        }),
        commonjs(),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        terser(),
        copy({
            targets: [{ src: 'stickers', dest: 'dist' }]
        })
    ]
};
