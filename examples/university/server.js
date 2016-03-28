/*eslint-disable max-nested-callbacks*/

'use strict'

const io = require('socket.io')()

const space = require('./main')
const Administration = space.Administration
const Professor = space.Professor
const Student = space.Student

let studentsCount = 0

io.on('connection', socket => {
    let agent
    socket.on('REGISTER', role => {
        switch (role) {
            case 'ADMINISTRATION':
                agent = Administration()
                break
            case 'PROFESSOR':
                agent = Professor()
                break
            case 'STUDENT':
                agent = Student(studentsCount)
                studentsCount += 1
                break
            default:
                break
        }
    })

    // This next function is just an utility function that generalizes the
    // process of transforming an agent response into a message that can be
    // sent over the socket connection.
    const bridgeResponse = (tag, method) => {
        const requestTag = tag
        const responseTag = tag + '_COMPLETED'
        // When a request is received
        socket.on(requestTag, param => {
            // Call the specified agent method
            method(param, (err, res) => {
                // And emit the result of the call
                socket.emit(responseTag, err, res)
            })
        })
    }

    // Administration operations

    bridgeResponse('CREATE_COURSE', agent.createCourse)

    // Professor operations

    bridgeResponse('LOAD_COURSE', agent.watchCourses)
    bridgeResponse('OPEN_SESSION', agent.openSession)
    bridgeResponse('LOAD_ASSIGNMENT', agent.watchAssignments)
    bridgeResponse('ASSIGN_GRADE', agent.assignGrade)
    bridgeResponse('CLOSE_SESSION', agent.closeSession)

    // Student operations

    bridgeResponse('ENROLL', agent.enroll)
    bridgeResponse('LOAD_SESSION', agent.watchSessions)
    bridgeResponse('TAKE_EXAM', agent.takeExam)
    bridgeResponse('LOAD_RESULT', agent.watchResults)
    bridgeResponse('REJECT_GRADE', agent.rejectGrade)
    bridgeResponse('ACCEPT_GRADE', agent.acceptGrade)
})

io.listen(3000)
