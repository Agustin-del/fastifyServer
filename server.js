import Fastify from 'fastify';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registerSchema = {
    body: {
        type:'object',
        required: ['username', 'email', 'password'],
        properties: {
            username: {type: 'string', minLength: 3},
            email: {type: 'string', format:'email'},
            password: { 
                type: 'string', 
                minLength: 8,
                pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
            }
        },
        additionalProperties:false,
    }
};    


const fastify = Fastify({
    logger: true,
    http2:true,
    https: {
        allowHTTP1: true,
        key: process.env.FASTIFY_KEY,
        cert: process.env.FASTIFY_CERT,
    }
});

fastify.get('/', async function(request, reply) {
    try {
        const filePath = path.join(__dirname, 'static', 'index.html');
        const fileContent = await readFile(filePath, 'utf8');
        reply.type('text/html').send(fileContent);
    } catch (error) {
        reply.code(500).send('Error reading file');
    }
})

fastify.post('/register', {schema: registerSchema} async function(req, rep){
    const {username, email, password} = req.body;
    console.log({username: username[username], email: email[email], password:password[password]});
    rep.status(201).send({
        message : "User registered succesfully",
    });
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
