# incli protocol

## A simple protocol for Vectorized Affinity

## Operation

To run this thing you need a .env text file at the ROOT of the project's web-client
directory which contains just one line:

`VITE_OAIKEY=MyKeyHere`

were MyKeyHere is your OpenAI access token.

From there just run

`npm i`

to install dependencies and then run

`npm run dev`

to start your local server. This will bring up the little web component test framework and you can generate some vectors dude!

## Reference Server

The reference server is written as a Cloudflare worker in TypeScript. You can deploy that
as-is or you can port it to a server envirnment you like better.

If you have Wrangler set up locally, you can run this server locally, too! Remember that you will need to define variables for

- PINECONE_KEY - your pinecone secret key
- PINECONE_ENV - your pinecone env
- OAIKEY - your open ai key

in ".env" format in a file called .dev.vars at the root of the incli-workers directory, peer to wrangler.toml
