const fastify = require('fastify')({ logger: true })
const path = require('path')

fastify.register(require('@fastify/view'), {
  engine: {
    pug: require('pug')
  },
  root: path.join(__dirname, 'views'),
})

fastify.addContentTypeParser(
  'application/x-www-form-urlencoded',
  { parseAs: 'string' },
  function (req, body, done) {
    try {
      const parsed = require('querystring').parse(body)
      done(null, parsed)
    } catch (err) {
      done(err)
    }
  }
)

const users = [
  { id: 1, name: 'Иван Иванов', email: 'vanya@mail.ru' },
  { id: 2, name: 'Анастасия Петрова', email: 'nastya@mail.ru' },
  { id: 3, name: 'Дмитрий Сидоров', email: 'dima@mail.ru' }
]

fastify.get('/', async (req, rep) => {
  return rep.redirect('/users')
})

fastify.get('/users', async (req, rep) => {
  return rep.view('users.pug', { users: users })
})

fastify.get('/users/create', async (req, rep) => {
  return rep.view('form.pug')
})

fastify.post('/users', async (req, rep) => {
  const { name, email } = req.body
  const newUser = {
    id: users.length + 1,
    name: name,
    email: email
  }

  users.push(newUser)
  return rep.redirect('/users')
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('http://localhost:3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
