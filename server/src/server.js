import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/', (_req, res) => {
	res.send('hello from server!');
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
