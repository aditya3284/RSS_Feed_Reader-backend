import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.route.js';
import feedRouter from './routes/feed.route.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();
const corsOptions = { origin: process.env.CORS_ORIGIN };
const jsonOptions = { limit: '16kb', strict: true };
const urlencodedOptions = { limit: '16kb', extended: true, parameterLimit: 10 };

app.use(cors(corsOptions));
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded(urlencodedOptions));
app.use(express.json(jsonOptions));

app.use('/api/v1/user', userRouter);
app.use('/api/v1/feed', feedRouter);
app.use(errorHandler);
export default app;
