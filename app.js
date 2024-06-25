const express = require('express')
const app = express()
app.use(express.json())
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(e.message)
  }
}
initializeDBAndServer()

const checkRequestQueries = async (request, response, next) => {
  const {search_q, category, priority, status, date} = request.query
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsArray = categoryArray.includes(category)
    if (categoryIsArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }
  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  }
  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }
  if (date !== undefined) {
    try {
      const myDate = new Date(date)

      const formateDate = format(new Date(date), 'yyyy-MM-dd')
      console.log(formateDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      console.log(result, 'r')
      console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      console.log(isValidDate, 'V')
      if (isValidDate === true) {
        result.date = formateDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todoId = todoId
  request.search_q = search_q
  next()
}
const checkRequestBody = (request, response, next) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const {todoId} = request.params
  if (category !== undefined) {
    categoryArray = ['WORK', 'HOME', 'LEARNING']
    categoryIsArray = categoryArray.includes(category)

    if (categoryIsArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }
  if (priority !== undefined) {
    priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  }
  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }
  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)
      const formateDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formateDate)
      const result = toDate(new Date(formateDate))
      const isValidDate = isValid(result)
      console.log(isValidDate)
      console.log(isValidDate)
      if (isValidDate === true) {
        request.dueDate = formateDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todo = todo
  request.id = id
  request.todoId = todoId
  next()
}
//API 1
app.get('/todos/', checkRequestQueries, async (request, response) => {
  const {status = '', search_q = '', priority = '', category = ''} = request
  console.log(status, search_q, priority, category)
  const getTodoQuery = `
     SELECT 
       id,todo,priority,status,category,due_date AS dueDate 
     FROM 
      todo
     WHERE 
       todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%'
       AND status LIKE '%${status}%' AND category LIKE '%${category}%'`
  const todosArray = await db.all(getTodoQuery)
  response.send(todosArray)
})
//API 2
app.get('/todos/:todoId/', checkRequestQueries, async (request, response) => {
  const {todoId} = request
  const getTodoQuery = `
    SELECT 
      id,
      todo,
      priority,
      status,
      category,
      due_date AS dueDate
    FROM 
      todo 
    WHERE
      id = ${todoId}`
  const todo = await db.get(getTodoQuery)
  response.send(todo)
})
//API 3
app.get('/agenda/', checkRequestQueries, async (request, response) => {
  const {date} = request
  console.log(date, 'a')

  const selectDueDateQuery = `
   SELECT
     id,
     todo,
     priority,
     status,
     category,
     due_date AS dueDate
   FROM 
     todo 
   WHERE 
     due_date = '${date}'`
  const todosArray = await db.all(selectDueDateQuery)
  if (todosArray === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    response.send(todosArray)
  }
})
//API 4
app.post('/todos/', checkRequestBody, async (request, response) => {
  const {id, todo, category, priority, status, dueDate} = request
  const addTodoQuery = `
    INSERT INTO 
      todo (id, todo, category, priority, status, due_date)
    VALUES 
    (
      ${id},
      '${todo}',
      '${category}',
      '${priority}',
      '${status}',
      '${dueDate}'
    )`
  const createUser = await db.run(addTodoQuery)
  console.log(createUser)
  response.send('Todo Successfully Added')
})
//API 5
app.put('/todos/:todoId/', checkRequestBody, async (request, response) => {
  const {todoId} = request
  const {priority, todo, status, category, dueDate} = request
  let updateTodoQuery = null
  console.log(priority, todo, status, category, dueDate)
  switch (true) {
    case status !== undefined:
      updateStatusQuery = `
          UPDATE
            todo 
          SET 
            status = '${status}'
          WHERE
            id = ${todoId}`
      await db.run(updateStatusQuery)
      response.send('Status Updated')
      break
    case priority !== undefined:
      updatePriorityQuery = `
        UPDATE 
          todo 
        SET 
          priority = '${priority}'
        WHERE 
          id = ${todoId}`
      await db.run(updatePriorityQuery)
      response.send('Priority Updated')
      break
    case todo !== undefined:
      updateTodoQuery = `
        UPDATE 
          todo 
        SET 
          todo = '${todo}'
        WHERE 
          id = ${todoId}`
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break
    case category !== undefined:
      updateCategoryQuery = `
        UPDATE 
          todo 
        SET 
          category = '${category}'
        WHERE
          id = ${todoId}`
      await db.run(updateCategoryQuery)
      response.send('Category Updatetd')
      break
    case dueDate !== undefined:
      updateDuedateQuery = `
      UPDATE 
        todo
      SET 
        due_date = '${dueDate}'
      WHERE 
        id = ${todoId}`
      await db.run(updateDuedateQuery)
      response.send('Due Date Updated')
      break
  }
})
//API 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
    DELETE FROM
      todo 
    WHERE
      id = ${todoId}`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})
module.exports = app
