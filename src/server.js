const path = require('node:path')
const fs = require('node:fs')

const fastify = require('fastify')({
    logger: true,
})

const PORT = process.env.PORT ?? 3000

fastify.register(require('@fastify/helmet'))

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, '../static')
})

fastify.register(require('@fastify/multipart'), {
    attachFieldsToBody: true
})

fastify.register(require('@fastify/websocket'))

fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, ({socket} , req) => {
        socket.on('message', message => {
            console.log('message from client: ' + message.toString())
            socket.send('hi from server')
        })
    })
})

fastify.get('/', (req, rep) => {
    rep.sendFile('index.html')
})

fastify.post('/register', async(req, rep) => {
    const username = req.body.username.value
    const password = req.body.password.value
    const email = req.body.email.value
    const foto = await req.body.foto.toBuffer()

    try {
        if(!fs.existsSync(path.join(__dirname, '../resources'))) {
            await fs.promises.mkdir(path.join(__dirname, '../resources'))
        }
        fs.promises.writeFile(path.join(__dirname, '../resources', `${email}.jpg`), foto)
        fs.promises.writeFile(path.join(__dirname, '../resources', `${email}.txt`), JSON.stringify({username, password, email}))
        rep.status(201)
        return {message:'register succesfully'}
    } catch (e) {
        return e
    }
    
})

const start = async () => {
    try {
        await fastify.listen({port: PORT})
        console.log(`Running on http://localhost:${PORT}`)
    } catch(e) {
        fastify.log.error(e)
        process.exit(1)
    }
} 

start()