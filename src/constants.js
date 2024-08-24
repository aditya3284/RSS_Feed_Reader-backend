export const DB_NAME = 'demoproject';

export const HttpsStatusCode = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	INTERNAL_SERVER_ERROR: 500,
};

export const allowedImageFormats = ['webp', 'jpeg', 'jpg', 'png'];

export const emailRegex = /^\w+([.+-]?\w+)+@\w+([.-]?\w+)+\.(\w{2,6})$/;

// escaped backslash used in the below regex, due to warning by single backslash
// export const emailRegex = new RegExp('^\\w+([\.+\-]?\\w+)+@\\w+([\.\-]?\\w+)+\\.(\\w{2,6})$');

export const cookieOptions = {
	domain: process.env.COOKIE_DOMIAN,
	httpOnly: process.env.HTTP_ONLY_COOKIE ?? true,
	secure: process.env.COOKIE_SECURE ?? false,
};
