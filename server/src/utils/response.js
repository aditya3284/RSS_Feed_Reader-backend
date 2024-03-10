export class APIResponse {
	constructor(httpStatusCode, data, message = 'Success') {
		this.httpStatusCode = httpStatusCode;
		this.data = data;
		this.message = message;
		this.success = httpStatusCode < 400;
	}
}
