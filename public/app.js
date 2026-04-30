const app = document.getElementById('app')

function navigateTo(route) {
  history.pushState(null, '', route)
  renderRoute(route)
}

async function renderRoute(route) {
  if (route === '/' || route === '/users') {
    await renderUsersList()
  } else if (route === '/create') {
    renderCreateForm()
  } else if (route.match(/^\/users\/\d+\/edit$/)) {
    const id = route.split('/')[2]
    await renderEditForm(id)
  } else {
    app.innerHTML = '<h1>Страница не найдена</h1><p><span class="back-link" onclick="navigateTo(\'/\')">Вернуться на главную</span></p>'
  }
}

async function renderUsersList() {
  try {
    const response = await fetch('/api/users')
    const users = await response.json()
    
    let html = '<h1>Пользователи</h1>'
    
    if (users.length > 0) {
      users.forEach(user => {
        html += `
          <div class="user-item">
            <strong>${escapeHtml(user.name)}</strong> — ${escapeHtml(user.email)} (ID: ${user.id})
            <span class="actions">
              <button onclick="navigateTo('/users/${user.id}/edit')">Редактировать</button>
              <button onclick="deleteUser(${user.id})">Удалить</button>
            </span>
          </div>
        `
      })
    } else {
      html += '<p>Нет пользователей</p>'
    }
    
    app.innerHTML = html
  } catch (error) {
    app.innerHTML = '<p>Ошибка загрузки данных</p>'
  }
}

function renderCreateForm() {
  app.innerHTML = `
    <h1>Создание пользователя</h1>
    <form onsubmit="createUser(event)">
      <label for="name">Имя</label>
      <input id="name" type="text" required>
      
      <label for="email">Email</label>
      <input id="email" type="email" required>
      
      <button type="submit">Создать</button>
    </form>
    <span class="back-link" onclick="navigateTo('/')">← Назад к списку</span>
  `
}

async function renderEditForm(id) {
  try {
    const response = await fetch(`/api/users/${id}`)
    if (!response.ok) throw new Error('Не найден')
    
    const user = await response.json()
    
    app.innerHTML = `
      <h1>Редактирование пользователя</h1>
      <form onsubmit="updateUser(event, ${id})">
        <label for="name">Имя</label>
        <input id="name" type="text" value="${escapeHtml(user.name)}" required>
        
        <label for="email">Email</label>
        <input id="email" type="email" value="${escapeHtml(user.email)}" required>
        
        <button type="submit">Сохранить</button>
      </form>
      <span class="back-link" onclick="navigateTo('/')">← Назад к списку</span>
    `
  } catch (error) {
    app.innerHTML = `
      <h1>Пользователь не найден</h1>
      <p><span class="back-link" onclick="navigateTo('/')">Вернуться к списку</span></p>
    `
  }
}

async function createUser(event) {
  event.preventDefault()
  
  const name = document.getElementById('name').value
  const email = document.getElementById('email').value
  
  await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email })
  })
  
  navigateTo('/')
}

async function updateUser(event, id) {
  event.preventDefault()
  
  const name = document.getElementById('name').value
  const email = document.getElementById('email').value
  
  await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email })
  })
  
  navigateTo('/')
}

async function deleteUser(id) {
  if (confirm('Удалить пользователя?')) {
    await fetch(`/api/users/${id}`, {
      method: 'DELETE'
    })
    await renderUsersList()
  }
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

window.addEventListener('popstate', () => {
  renderRoute(window.location.pathname)
})

renderRoute(window.location.pathname)
