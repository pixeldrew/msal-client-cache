import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default [
    {
        input: "./src/index.ts",
        plugins: [
            typescript(),
            terser({
                format: {
                    comments: "some",
                    beautify: true,
                    ecma: "2022",
                },
                compress: false,
                mangle: false,
                module: true,
            }),
        ],
        output: [
            { format: "es", file: "./dist/esm/index.js" },
            { format: "cjs", file: "./dist/cjs/index.cjs" },
        ],
    },
    {
        input: "./src/index.ts",
        plugins: [dts()],
        output: {
            format: "es",
            file: "./dist/index.d.ts",
        },
    },
];
