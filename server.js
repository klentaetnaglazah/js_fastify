const fastify = require('fastify')({ logger: true })
const path = require('path')
const Database = require('better-sqlite3')

const db = new Database('database.sqlite')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL
  )
`)

const count = db.prepare('SELECT COUNT(*) AS cnt FROM users').get()
if (count.cnt === 0) {
  const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
  insert.run('Иван Иванов', 'vanya@mail.ru')
  insert.run('Анастасия Петрова', 'nastya@mail.ru')
  insert.run('Дмитрий Сидоров', 'dima@mail.ru')
}

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

fastify.get('/', async (req, rep) => {
  return rep.redirect('/users')
})

fastify.get('/users', async (req, rep) => {
  const users = db.prepare('SELECT * FROM users').all()
  return rep.view('users.pug', { users })
})

fastify.get('/users/create', async (req, rep) => {
  return rep.view('form.pug')
})

fastify.post('/users', async (req, rep) => {
  const { name, email } = req.body
  db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(name, email)
  return rep.redirect('/users')
})

fastify.get('/users/:id/edit', async (req, rep) => {
  const { id } = req.params
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!user) {
    return rep.code(404).view('404.pug')
  }
  return rep.view('edit.pug', { user })
})

fastify.post('/users/:id', async (req, rep) => {
  const { id } = req.params
  const { name, email } = req.body
  db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, id)
  return rep.redirect('/users')
})

fastify.post('/users/:id/delete', async (req, rep) => {
  const { id } = req.params
  db.prepare('DELETE FROM users WHERE id = ?').run(id)
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
