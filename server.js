import Fastify from 'fastify';
import path from 'path';
// import { readFile } from 'fs/promises';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
    logger: true,
    http2:true,
    https: {
        allowHTTP1: true,
        key: process.env.FASTIFY_KEY,
        cert: process.env.FASTIFY_CERT,
    }
});

fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'static'),
    prefix: '/'
})

fastify.get('/', async function(request, reply) {
    // try {
    //     const filePath = path.join(__dirname, 'static', 'index.html');
    //     const fileContent = await readFile(filePath, 'utf8');
    //     reply.type('text/html').send(fileContent);
    // } catch (error) {
    //     reply.code(500).send('Error reading file');
    // }
    return reply.sendFile('index.html');
})

const start = async () => {
    try {
        await fastify.listen({port: 3000});
    } catch (e) {
        fastify.log.error(e);
        process.exit(1);
    }
}

start()
