import Fastify from "fastify";
import fastifyEnv from '@fastify/env';
import fastifyMultipart from "@fastify/multipart";
import { pipeline} from "node:stream/promises";
import fs from 'node:fs'
import { readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import request from "supertest";

//me falta ver lo de los campos adicionales, lo voy a dejar fallando.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let NEXT_PORT = 3000;

const options = {
    dotenv:true,
    schema: {    
        type: 'object',
        properties: {
            FASTIFY_KEY: { type: 'string' },
            FASTIFY_CERT: { type: 'string' },
        },
        required: ['FASTIFY_KEY', 'FASTIFY_CERT']
    }
};

const registerSchema = {
    consumes:['multipart/form-data'],
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
                type : 'object',
                // required: ['data', 'filename', 'mimetype'],
                // properties: {
                //     data: {type:'string', format:'binary'},
                //     filename:{type:'string'},
                //     mimetype:{type:'string'}
                // },
            }
        },
        additionalProperties: false,
    }
};    

const createFastifyInstance = () => {
    
    const fastify = Fastify({
        logger:true,
    });

    fastify.port = NEXT_PORT++;

    fastify.register(fastifyEnv, options)

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

    fastify.register(fastifyMultipart, { attachFieldsToBody: 'keyValues'});

    fastify.get('/', async function(request, reply) {
        try {
            const filePath = path.join(__dirname, '../static', 'index.html');
            const fileContent = await readFile(filePath, 'utf8');
            reply.type('text/html').send(fileContent);
        } catch (error) {
            reply.code(500).send('Error reading file');
        }
    });

    fastify.post('/register', {schema: registerSchema}, async function(req, rep){
        let username, email, password, foto;
     
        try {
            username = await req.body.username;
            email = await req.body.email;
            password = await req.body.password;
            foto = await req.file();
            await pipeline(foto.file, fs.createWriteStream(path.join(`/resources/${foto.filename}`)))
        } catch (e) {
            console.error(e);
        }
    
        console.log({username: username[username], email: email[email], password:password[password]});
    
        rep.status(201).send({
            message : "User registered succesfully",
        });
    }); 
    
    return fastify;
};

let fastify;

beforeAll(async () => {
    fastify = createFastifyInstance();
    await fastify.listen({port:fastify.port});
})

afterAll( async () => {
    fastify.close();
})

describe('Carga variables de entorno', () => {
    test('should exist FASTIFY_KEY and have private key format', async () => {
        expect(process.env.FASTIFY_KEY).toBeDefined();
        expect(process.env.FASTIFY_KEY).toContain("-----BEGIN PRIVATE KEY-----", "-----END PRIVATE KEY-----");
    });

    test('should exist FASTIFY_CERT and have certificate format', async () => {
        expect(process.env.FASTIFY_CERT).toBeDefined();
        expect(process.env.FASTIFY_CERT).toContain("-----BEGIN CERTIFICATE-----", "-----END CERTIFICATE-----");
    });
});

describe('Carga index', () => {
    test('should return 200 and HTML content', async () => {
        const response = await request(fastify.server).get('/');
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toMatch(/html/);
        expect(response.text).toContain('<!DOCTYPE html>');
    });
});

describe('Registro de usuario', () => {
    test('should register a user succesfully', async () => {
        const response = await request(fastify.server)
            .post('/register')
            .set('content-type', 'multipart/form-data')
            .field('username',"testUser")
            .field('email',"testuser@example.com")
            .field('password', "abC!1234")
            .attach('foto', path.join(__dirname, 'hola.txt'))

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            message:"User registered succesfully",
        });
    });

    test('should fail if a field is missing', async () => {
        let response = await request(fastify.server)
            .post('/register')
            .send({
                email:"testuser@example.com",
                password:"abC!1234",
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/body must have required property 'username'/);
        
        response = await request(fastify.server)
            .post('/register')
            .send({
                username:'testuser',
                password:"abC!1234",
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/body must have required property 'email'/);

        response = await request(fastify.server)
            .post('/register')
            .send({
                username:'testuser',
                email:"testuser@example.com",
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/body must have required property 'password'/);
    });

    test('should return error if username is invalid', async () => {
        const response = await request(fastify.server)
            .post('/register')
            .send({
                username:'',
                email:"testuser@example.com",
                password:"abC!1234",
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/username must NOT have fewer than 3 characters/);
    });

    test('should return error if email is invalid', async () => {
        const response = await request(fastify.server)
            .post('/register')
            .send({
                username:"testUser",
                email:"",
                password:"abC!1234",
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/email must match format/);
    });

    test('should return error if password is invalid', async () => {
        const response = await request(fastify.server)
            .post('/register')
            .send({
                username:"testUser",
                email:"testuser@example.com",
                password:"12345678",
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/password must (NOT have fewer than 8 characters|match pattern)/)
    });

    test('should return error if there is an extra field', async() => {
        const response = await request(fastify.server)
            .post('/register')
            .send({
                username:"testUser",
                email:"testuser@example.com",
                password:"abC!1234",
                extraField: "extraValue"
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/what/);
    });

    test('should upload file successfully', async () => {
        const response = await request(fastify.server)
            .post('/upload')
            .set('Content-type', 'multipart/form-data')
            .attach('file', path.join(__dirname, '/resources/file.txt'));
        
        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            message: "File uploaded succesfully",
        });
    });
});
