import { Hono, Context } from 'hono';
import { handle } from 'hono/aws-lambda';
import { logger } from 'hono/logger';
import { githubAuth } from '@hono/oauth-providers/github';

import { listSboms } from './app';

const app = new Hono();

app.use(logger());
app.use(
  '/github',
  githubAuth({
    client_id: process.env.GITHUB_ID,
    client_secret: process.env.GITHUB_SECRET,
    scope: ['user'],
  }),
);

app.get('/github', async (c: Context) => {
  const token = c.get('token');
  // const refreshToken = c.get('refresh-token');
  if (!token?.token) {
    return c.redirect('/github');
  }

  try {
    const sboms = await listSboms(token.token);

    return c.json({
      sboms,
    });
  } catch (e) {
    return c.json(JSON.parse(JSON.stringify(e)), 500);
  }
});
export const handler = handle(app);
