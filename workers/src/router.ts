import { Router } from 'itty-router';
import { PineconeClient, UpsertRequest } from '@pinecone-database/pinecone';

// now let's create a router (note the lack of "new")
const router = Router();

// GET collection index
router.get('/api/todos', async (request, env, ctx) => {
	console.log(env);
	return new Response('Todos Index! ' + env.PINECONE_KEY);
});

router.post('/api/affinity/set', async (request, env) => {
	const content = await request.json();

	// Create a client
	const client = new PineconeClient();

	// Initialize the client
	await client.init({
		apiKey: env.PINECONE_KEY,
		environment: env.PINECONE_ENV,
	});

	const index = client.Index('inkli');

	// TBD probably want to break down into fields e.g.
	// "id": "uuid", "metadata": {"context": "nike"}, "values": [vectors]
	const upsertRequest: UpsertRequest = {
		vectors: content.vectors,
		namespace: content.namespace,
	};
	const result = await index.upsert({ upsertRequest });
});

router.post('/api/affinity/search', async (request, env) => {
	const content = await request.json();

	// Create a client
	const client = new PineconeClient();

	// Initialize the client
	await client.init({
		apiKey: env.PINECONE_KEY,
		environment: env.PINECONE_ENV,
	});

	const index = client.Index('inkli');

	const queryResult = await index.query({
		queryRequest: {
			vector: content.searchVector,
			includeMetadata: true,
			includeValues: true,
			namespace: 'default',
			// filter: {
			//   section: { $eq: section },
			// },
			topK: 10,
		},
	});

	console.log(queryResult);

	return new Response('Creating Todo: ' + JSON.stringify(queryResult));
});

///////////////////////////////////////////////////////////////
/// TESTS are below, ignore them

// GET item
router.get('/api/todos/:id', ({ params }) => new Response(`Todo #${params.id}`));

// POST to the collection (we'll use async here)
router.post('/api/todos', async (request) => {
	const content = await request.json();

	return new Response('Creating Todo: ' + JSON.stringify(content));
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
