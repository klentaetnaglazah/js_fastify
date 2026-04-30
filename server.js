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

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/'
})

fastify.get('/api/users', async (req, rep) => {
  const users = db.prepare('SELECT * FROM users').all()
  return users
})

fastify.get('/api/users/:id', async (req, rep) => {
  const { id } = req.params
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!user) {
    return rep.code(404).send({ error: 'Пользователь не найден' })
  }
  return user
})

fastify.post('/api/users', async (req, rep) => {
  const { name, email } = req.body
  const result = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(name, email)
  return rep.code(201).send({ id: result.lastInsertRowid, name, email })
})

fastify.put('/api/users/:id', async (req, rep) => {
  const { id } = req.params
  const { name, email } = req.body
  const result = db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, id)
  if (result.changes === 0) {
    return rep.code(404).send({ error: 'Пользователь не найден' })
  }
  return { id: Number(id), name, email }
})

fastify.delete('/api/users/:id', async (req, rep) => {
  const { id } = req.params
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id)
  if (result.changes === 0) {
    return rep.code(404).send({ error: 'Пользователь не найден' })
  }
  return { success: true }
})

fastify.setNotFoundHandler((req, rep) => {
  if (req.method === 'GET') {
    return rep.sendFile('index.html')
  }
  return rep.code(404).send({ error: 'Не найдено' })
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
