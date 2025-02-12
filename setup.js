import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';

import { router } from './router.js';

export const app = new Koa()

app.use(cors());
app.use(bodyParser({ enableTypes: ['json', 'form', 'text'] }));
app.use(router.routes());
app.use(router.allowedMethods());