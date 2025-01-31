const Fastify = require("fastify");
const fastifyEnv = require  ('@fastify/env');
const fastifyMultipart = require ("@fastify/multipart");
const helmet = require ('@fastify/helmet');
const fs = require('node:fs') 
const { readFile} = require ('node:fs/promises');
const {fileURLToPath} = require ('node:url');
const path = require ('node:path');
const request = require ("supertest");

//me falta ver lo de los campos adicionales, lo voy a dejar fallando.

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
let NEXT_PORT = 3000;

const resourcesPath = path.join(__dirname, 'resources');

const optionsEnv = {
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

const optionsMultipart = {
    attachFieldsToBody: 'keyValues',
};

const optionsHelmet = {

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

const createFastifyInstance = () => {
    
    const fastify = Fastify({
        logger:true,
    });

    fastify.port = NEXT_PORT++;

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

    fastify.register(helmet, optionsHelmet);

    fastify.get('/', async function(request, reply) {
        try {
            const filePath = path.join(__dirname, '../static', 'index.html');
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

describe('tests headers', () => {
    test('should have csp headers', async () => {
        const response = await request(fastify.server)
            .get('/')
            .set('Accept', 'text/html')
            .set('Content-Type', 'text/html')
            .send()
        
            expect(response.headers).toHaveProperty('content-security-policy')
    });
})

describe('Carga index', () => {
    test('should return 200 and HTML content', async () => {
        const response = await request(fastify.server).get('/');
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toMatch(/html/);
        expect(response.text).toContain('<!DOCTYPE html>');
    });
});

describe('Registro de usuario', () => {
    let foto;
    beforeAll(() => {
        foto = fs.readFileSync(path.join(resourcesPath, 'mvc.jpg'), e => {
            if (e) {
                console.error("Error reading the foto: ", e)
            }
        })
    })

    test('should register a user succesfully', async () => {
        const response = await request(fastify.server)
            .post('/register')
            .set('content-type', 'multipart/form-data')
            .field('username',"testUser")
            .field('email',"testuser@example.com")
            .field('password', "abC!1234")
            .attach('foto', foto)

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            message:"Cliente registrado exitosamente",
        });
    });

    test('should fail if a field is missing', async () => {
        let response = await request(fastify.server)
            .post('/register')
            .send({
                email:"testuser@example.com",
                password:"abC!1234",
                foto: foto
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/body must have required property 'username'/);
        
        response = await request(fastify.server)
            .post('/register')
            .send({
                username:'testuser',
                password:"abC!1234",
                foto: foto
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/body must have required property 'email'/);

        response = await request(fastify.server)
            .post('/register')
            .send({
                username:'testuser',
                email:"testuser@example.com",
                foto: foto
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/body must have required property 'password'/);

        response = await request(fastify.server)
            .post('/register')
            .send({
                username:'testuser',
                email:"testuser@example.com",
                password:"abC!1234",
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/body must have required property 'foto'/);
    });

    test('should return error if username is invalid', async () => {
        const response = await request(fastify.server)
            .post('/register')
            .send({
                username:'',
                email:"testuser@example.com",
                password:"abC!1234",
                foto:foto
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
                foto:foto
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
                foto:foto
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/password must (NOT have fewer than 8 characters|match pattern)/)
    });

    //este me tiro este error ahora;
    //  Expected pattern: /what/
    // Received string:  "Sucedió un error durante el registro: The \"data\" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received an instance of Object"
    test('should return error if there is an extra field', async() => {
        const response = await request(fastify.server)
            .post('/register')
            .send({
                username:"testUser",
                extraField: "extraValue",
                email:"testuser@example.com",
                password:"abC!1234",
                foto:foto,
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/what/);
    });

    //falta testear el archivo, pero Juank dirá que tan robusto y la mejor forma

});
