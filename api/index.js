// Vercel serverless entry point.
// Re-exports the Express app from server.js; Vercel invokes it as a function.
module.exports = require("../server.js");
