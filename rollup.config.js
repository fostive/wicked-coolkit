import lwcCompiler from '@lwc/rollup-plugin';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import virtual from '@rollup/plugin-virtual';

const generateComponentInput = (name) => {
    const tagName = name.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`);
    return `import Component from './src/client/modules/wck/${name}/${name}';
    customElements.define('wck-${tagName}', Component.CustomElementConstructor);`;
};

const components = (value) =>
    ['tradingCard', 'hitCounter', 'webring'].reduce((acc, c) => {
        acc[c] = value(c);
        return acc;
    }, {});

export default {
    input: components((c) => c),
    output: [
        {
            dir: './dist',
            format: 'esm'
        }
    ],
    plugins: [
        virtual(components(generateComponentInput)),
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
