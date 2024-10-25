import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import terser from "@rollup/plugin-terser";

const warningHandler = (warning, warn) => {
  if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
    return;
  }
  if (warning.code === "THIS_IS_UNDEFINED") {
    return;
  }
  warn(warning);
};

export default [
  {
    input: "lib/index.js",
    output: [
      {
        dir: "dist/cjs",
        format: "cjs",
        sourcemap: true,
        plugins: [],
      },
      {
        dir: "dist/esm",
        format: "esm",
        sourcemap: true,
        plugins: [],
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve({ browser: true }),
      commonjs(),
      postcss({
        // inject: {
        //   insertAt: "top",
        // },
        config: {
          path: "./postcss.config.js",
        },
        minimize: false,
        extensions: [".css"],
        extract: "styles.css"
      }),
      terser(),
    ],
    external: ["react", "react-dom"],
    onwarn: warningHandler,
  },
  {
    input: "src/index.ts",
    output: [{ file: "dist/types.d.ts", format: "es" }],
    plugins: [dts.default()],
    external: [/\.css$/],
    onwarn: warningHandler,
  },
];
