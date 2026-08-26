// The minified bundle is what most consumers load, and nothing about it is
// hand-written — it is whatever `minify` produced. Running the same contract
// against it turns a `minify` upgrade from a leap of faith into a checked one.
import "../../dist/index.min.js";
import { describeImageCompare } from "./behavior.js";

describeImageCompare("dist/index.min.js");
