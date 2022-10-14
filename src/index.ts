import * as dotenv from 'dotenv';
dotenv.config();

import Kurama from '@struct/Kurama';

const { TOKEN } = process.env;

const client = new Kurama();

client.login(TOKEN);