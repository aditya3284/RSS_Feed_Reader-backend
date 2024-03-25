/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/
export const errorHandler = (err, _req, res, _next)=> {
    console.log("sad error handler", err.httpStatusCode);
    res.status(err.httpStatusCode || 500).json({httpStatusCode:err.httpStatusCode,message:err.message,success:false});
}
