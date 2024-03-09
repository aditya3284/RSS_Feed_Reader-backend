export class APIError extends Error {
	constructor(httpStatusCode, message, cause) {
		super(message);

		this.name = this.constructor.name;
		this.message = message;
		this.httpStatusCode = httpStatusCode;
		this.cause = cause;

		if (this.cause) {
			this.stack = this.cause.stack;
		} else {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}
