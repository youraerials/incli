import {
	error, // creates error responses
	json, // creates JSON responses
	Router,
} from 'itty-router';
import { createCors } from 'itty-cors';
import { missing } from 'itty-router-extras';

import { PineconeClient, UpsertRequest } from '@pinecone-database/pinecone';

// permissive CORS setup
const { preflight, corsify } = createCors({
	methods: ['GET', 'POST', 'DELETE'], // GET is included by default... omit this if only using GET
	origins: ['*'], // defaults to allow all (most common).  Restrict if needed.
	maxAge: 3600,
	headers: {
		'my-custom-header': 'will be injected with each CORS-enabled response',
	},
});

// typing for ENV values
// note that these must be SET server-side in the
// CF Worker config!  Don't forget to set the same
// variables in .dev.vars at the root of the workers
// directory, peer to wrangler.toml.  This file is not
// chcked in!
export interface Env {
	PINECONE_KEY: string;
	PINECONE_ENV: string;
	OAIKEY: string;
}

let router = Router();

// GET collection index
router
	.all('*', preflight)

	.post('/api/affinity/vector', async (request, env) => {
		const content = (await request.json()) as any;

		if (!env.OAIKEY) {

			console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
   HEY!  you need a .dev.vars file with your ENV in it!
	 ...I'm not psychic... yet.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
`);
			return json({
				error: 'HEY!  you need a .dev.vars file with your ENV in it!'
			});
		}

		try {

			console.log('creating vector for: ' + content.vectorText)
			const result = await fetch('https://api.openai.com/v1/embeddings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${env.OAIKEY}`,
				},
				body: JSON.stringify({
					input: content.vectorText, // should we vec the KV pair or just the val?
					model: 'text-embedding-ada-002',
				}),
			});

			// TBD error check and all that jazz
			const jsonData = (await result.json()) as any;

			console.log(JSON.stringify(jsonData))

			const embeddingResult = jsonData.data[0].embedding;
			console.log('dimensions ' + embeddingResult.length);

			return json({
				key: content.affinityKey,
				text: content.affinityValue,
				embeddingResult,
			});

		} catch (er: any) {
			console.log(er.message);
			return json({
				error: er.message
			});
		}

	})

	.post('/api/affinity/set', async (request, env) => {
		const content = (await request.json()) as any;

		// Create a client
		const client = new PineconeClient();

		try {

			// Initialize the client
			await client.init({
				apiKey: env.PINECONE_KEY,
				environment: env.PINECONE_ENV,
			});

			const index = client.Index('inkli');

			// TBD probably want to add some more granular metadata

			console.log('vectors: ' + content.vectors.length);
			let upsertRequest: UpsertRequest = {
				vectors: [
					{
						id: content.affinityKey,
						metadata: { name: 'cookie', key: content.affinityKey, value: content.affinityValue },
						values: content.vectors
					}
				],
				// namespace: 'cookies' // FYI the free pinecone tier doesn't support namespaces
			};

			const result = await index.upsert({ upsertRequest });

			console.log(JSON.stringify(result));

			return json({
				result
			});

		} catch (er: any) {
			console.log(er.message);
			return json({
				error: er.message
			});
		}
	})

	.post('/api/affinity/search', async (request, env) => {
		const content = (await request.json()) as any;

		// Create a client
		const client = new PineconeClient();

		console.log('searching ' + content.searchText + ' with ' + content.searchVectors.length);

		try {

			// Initialize the client
			await client.init({
				apiKey: env.PINECONE_KEY,
				environment: env.PINECONE_ENV,
			});

			const index = client.Index('inkli');

			const queryResult = await index.query({
				queryRequest: {
					vector: content.searchVectors,
					includeMetadata: true,
					includeValues: true,
					// filter: {
					// 	value: { $eq: content.searchText },
					// },
					topK: 3,
				},
			});

			console.log('')
			console.log(queryResult);

			return json(queryResult);

		} catch (er: any) {
			console.log(er.message);
			return json({
				error: er.message
			});
		}
	})
	.all('*', () => missing('That does not look like a valid API endpoint'));

// Export a default object containing event handlers
export default {
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return await router
			.handle(request, env, ctx)
			.catch((err) => error(500, err.stack))
			.then(corsify);
	},
};
