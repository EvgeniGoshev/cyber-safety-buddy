import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const createHandler = require("../server/vercelAdapter.js");
const endpoint = require("../server/trackEvent.js");
export default createHandler(endpoint);
