import jwt from 'jsonwebtoken';
import APIError from '../utils/errors.js';
import { HttpsStatusCode } from '../constants.js';

const verifyAccess = (req, _res, next) => {
	try {
		const accessToken =
			req.cookies?.accessToken || req.header('Authorization')?.split(' ');

		if (!accessToken) {
			throw new APIError(HttpsStatusCode.UNAUTHORIZED, 'Unauthorized Request');
		}
		const jwtPayload = jwt.verify(
			accessToken,
			process.env.ACCESS_TOKEN_JWT_SECRET,
			{
				algorithms: process.env.ACCESS_TOKEN_JWT_ALGORITHM,
				ignoreExpiration: false,
			}
		);

		if (!jwtPayload) {
			throw new APIError(HttpsStatusCode.UNAUTHORIZED, jwtPayload.message);
		}

		req.userID = jwtPayload.Uid;
		next();
	} catch (error) {
		next(
			new APIError(
				HttpsStatusCode.UNAUTHORIZED,
				error.message || 'Invalid Access Request'
			)
		);
	}
};

export { verifyAccess };
