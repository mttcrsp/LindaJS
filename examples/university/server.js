/*eslint-disable max-nested-callbacks*/

'use strict'

const io = require('socket.io')()

const space = require('./space')
const Administration = space.Administration
const Professor = space.Professor
const Student = space.Student

let studentsCount = 0

io.on('connection', socket => {
  let agent

  // This next function is just an utility function that generalizes the
  // process of transforming an agent response into a message that can be
  // sent over the socket connection. It binds the specified socket request
  // tag to the specified method of the agent.
  const bind = (tag, method) => {
    const requestTag = tag
    const responseTag = tag + '_COMPLETED'
    socket.on(requestTag, param => {
      const cb = (err, res) => {
        socket.emit(responseTag, (err ? err.message : null), res)
      }
      if (param !== null) {
        return method(param, cb)
      }
      method(cb)
    })
  }

  socket.on('REGISTER', role => {
    console.log('registering as ' + role)
    switch (role) {
      case 'ADMINISTRATION':
        agent = Administration()
        bind('CREATE_COURSE', agent.createCourse)
        break

      case 'PROFESSOR':
        agent = Professor()
        bind('OPEN_SESSION', agent.openSession)
        bind('CLOSE_SESSION', agent.closeSession)
        bind('ASSIGN_GRADE', agent.assignGrade)
        bind('LOAD_COURSE', agent.watchCourse)
        bind('LOAD_ASSIGNMENT', agent.watchAssignment)
        break

      case 'STUDENT':
        agent = Student(studentsCount)
        bind('ENROLL', agent.enroll)
        bind('TAKE_EXAM', agent.takeExam)
        bind('ACCEPT_GRADE', agent.acceptGrade)
        bind('REJECT_GRADE', agent.rejectGrade)
        bind('LOAD_COURSE', agent.watchCourse)
        bind('LOAD_SESSION', agent.watchSession)
        bind('LOAD_RESULT', agent.watchResult)
        studentsCount += 1
        break

      default:
        break
    }
  })
})

io.listen(3000)
