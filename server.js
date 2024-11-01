import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import fastifyMultipart from '@fastify/multipart';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const optionsMultipart = {
    attachFieldsToBody: 'keyValues',
    sharedSchemaId:'#archivo',
}

const optionsEnv = {
    dotenv:true,
    schema: {     // Define el esquema de las variables de entorno
        type: 'object',
        properties: {
            FASTIFY_KEY: { type: 'string' },
            FASTIFY_CERT: { type: 'string' },
        },
        required: ['FASTIFY_KEY', 'FASTIFY_CERT']
    }
};

const registerSchema = {
    consumes: ['multipart/form-data'],
    body: {
        type:'object',
        required: ['username', 'email', 'password', 'foto'],
        properties: {
            username: {type: 'string', minLength: 3},
            email: {type: 'string', format:'email'},
            password: { 
                type: 'string', 
                minLength: 8,
                pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
            },
            foto: {
                type: 'object'
            }
        },
        additionalProperties: false,    }
};    

const fastify = Fastify({
    logger: true,
});

fastify.register(fastifyEnv, optionsEnv)
    .ready((error) => {
        if(error) {
            console.error(error);
        } else {
            fastify.http2 = true;
            fastify.https =  {
                allowHTTP1: true,
                key: process.env.FASTIFY_KEY,
                cert: process.env.FASTIFY_CERT,
            };
        };
    });

fastify.register(fastifyMultipart, optionsMultipart);

fastify.get('/', async function(request, reply) {
    try {
        const filePath = path.join(__dirname, 'static', 'index.html');
        const fileContent = await readFile(filePath, 'utf8');
        reply.type('text/html').send(fileContent);
    } catch (error) {
        reply.code(500).send('Error reading file');
    }
});

fastify.post('/register', {schema:registerSchema}, async function(req, rep){
    try {
        const {username, email, password, foto} = req.body
        fs.writeFile(path.join(__dirname, 'resources', `${email}.jpg`), foto, e => {
            if(e) {
                throw e;
            }
        })
        console.log({username, email, password})
        rep.status(201).send({
            message:"Cliente registrado exitosamente"
        })
    } catch (e) {
        rep.status(400).send({
            message: "Sucedió un error durante el registro: " + e.message
        })
    } 
});

const start = async () => {
    try {
        await fastify.listen({port: 3000});
    } catch (e) {
        fastify.log.error(e);
        process.exit(1);
    }
};

start();
