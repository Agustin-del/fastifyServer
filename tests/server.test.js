import Fastify from "fastify";
import { readFile} from 'node:fs/promises';;
import {config} from 'dotenv';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import request from "supertest";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createFastifyInstance = () => {
    const fastify = Fastify({
        logger:true,
            http2:true,
            https: {
                allowHTTP1:true,
                key: process.env.FASTIFY_KEY,
                cert: process.env.FASTIFY_CERT,
            }
        });

        fastify.get('/', async function(request, reply) {
            try {
                const filePath = path.join(__dirname, '../static', 'index.html');
                const fileContent = await readFile(filePath, 'utf8');
                reply.type('text/html').send(fileContent);
            } catch (error) {
                reply.code(500).send('Error reading file');
            }
        });

        //Falta aplicar un schema.
        fastify.post('/register', async function(req, rep){
            rep.status(201).send({
                message : "User registered succesfully",
            });
        })
        

        return fastify;
}

describe('Registro de usuario', () => {
    let fastify;

    beforeAll(async () => {
        fastify = createFastifyInstance();
        await fastify.listen({port:3000});
    })

    afterAll(async () => {
        await fastify.close();
    })

    test('should return 200 and HTML content', async () => {
        const response = await request(fastify.server).get('/');
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toMatch(/html/);
        expect(response.text).toContain('<!DOCTYPE html>');
    })

    test('should register a user succesfully', async () => {
        const response = await request(fastify.server)
            .post('/register')
            .send({
                username:"testUser",
                email:"testuser@example.com",
                password:"testPassword",
        })
        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            message:"User registered succesfully",
        })
    })
})