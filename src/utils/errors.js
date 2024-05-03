export default class APIError extends Error {
	constructor(httpStatusCode, message) {
		super(message);

		this.name = this.constructor.name;
		this.message = message;
		this.httpStatusCode = httpStatusCode;

		Error.captureStackTrace(this, this.constructor);
	}
}
