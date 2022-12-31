import * as dotenv from "dotenv";

dotenv.config();

import Kuramisa from "#struct/Kuramisa";

const { TOKEN } = process.env;

const client = new Kuramisa();

client.login(TOKEN);
