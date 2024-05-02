const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const app = express()
const dbPath = path.join(__dirname, 'userData.db')

let db = null

app.use(express.json())

const server = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e}`)
    process.exit(1)
  }
}

server()

const validate = pw => {
  return pw.length > 4
}

app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body

  let hashedpassword = await bcrypt.hash(password, 10)

  let query = `SELECT * FROM user WHERE username = '${username}'`
  let result = await db.get(query)

  if (result === undefined) {
    let q = `INSERT INTO user (username,name,password,gender,location) 
    VALUES ('${username}','${name}','${hashedpassword}','${gender}','${location}')`

    if (!validate(password)) {
      response.send('Password is too short')
      response.status(400)
    } else {
      await db.run(q)
      response.send('User created successfully')
      response.status(200)
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const q = `SELECT * FROM user WHERE username ='${username}'`
  const result = await db.get(q)

  if (result === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const match = await bcrypt.compare(password, result.password)
    if (match === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const q = `SELECT * FROM user WHERE username = '${username}'`
  const res = await db.get(q)

  if (res === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const match = await bcrypt.compare(oldPassword, res.password)

    if (match === true) {
      if (validate(password)) {
        const hashedpassword = await bcrypt.hash(newPassword, 10)
        const q1 = `UPDATE user SET password = '${hashedpassword}' WHERE username = '${username}'`
        const user = await db.run(q1)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
