const Linda = require('../../src/Linda')
const Operation = Linda.Operation
const Permission = Linda.Permission
const Role = Linda.Role
const _ = Linda.Matcher.WILDCARD

const Model = require('./model')

// The administration can only create courses, this corresponds to adding a new
// course tuple to the space using the format specified above.

const CREATE_COURSE_PERMISSION = Permission(
  Operation.TYPE.OUT, { type: Model.COURSE, id: _ }
)
const ADMINISTRATION_ROLE = Role([CREATE_COURSE_PERMISSION])

// A professor should be able to:
//  - read new courses that are added to the space,
//  - open new exam sessions by specifiyng the date in which they will take
//    place,
//  - close an exam sessions,
//  - assign a grade to a student.

const READ_COURSES_PERMISSION = Permission(
  Operation.TYPE.RD,
  { type: Model.COURSE, id: _ }
)
const OPEN_SESSION_PERMISSION = Permission(
  Operation.TYPE.OUT,
  { type: Model.SESSION, course: _, date: _ }
)
const CLOSE_SESSION_PERMISSION = Permission(
  Operation.TYPE.INP,
  { type: Model.SESSION, course: _, date: _ }
)
const READ_ASSIGNMENTS_PERMISSION = Permission(
  Operation.TYPE.RD,
  { type: Model.ASSIGNMENT, course: _, date: _, student: _ }
)
const ASSIGN_GRADE_PERMISSION = Permission(
  Operation.TYPE.OUT,
  { type: Model.GRADE, course: _, date: _, student: _, grade: _ }
)

const PROFESSOR_ROLE = Role([
  READ_COURSES_PERMISSION,
  OPEN_SESSION_PERMISSION,
  READ_ASSIGNMENTS_PERMISSION,
  ASSIGN_GRADE_PERMISSION,
  CLOSE_SESSION_PERMISSION
])

// The creation of a student role and permissions is a bit more complex as a
// student should only be able to interact with tuples that specify his/her id.
// However we do not know yet the student id. This problem can be solved by
// deferring the creation of a student role and permissions up until the
// creation of the student agent itself, when we will know its id. This next
// function accomplishes exactly that: when we know they student id this
// function will create a new role for the student with the right permissions
// and add it to the space.

const createStudentRole = id => {
  const student = id

  const ENROLL_PERMISSION = Permission(
    Operation.TYPE.OUT,
    { type: Model.ENROLL, course: _, student }
  )
  const READ_SESSIONS_PERMISSION = Permission(
    Operation.TYPE.RD,
    { type: Model.SESSION, course: _, date: _ }
  )
  const TAKE_EXAM_PERMISSION = Permission(
    Operation.TYPE.OUT,
    { type: Model.ASSIGNMENT, course: _, date: _, student }
  )
  const READ_RESULTS_PERMISSION = Permission(
    Operation.TYPE.RD,
    { type: Model.GRADE, course: _, date: _, student, grade: _ }
  )
  const REJECT_GRADE_PERMISSION = Permission(
    Operation.TYPE.INP,
    { type: Model.GRADE, course: _, date: _, student, grade: _ }
  )
  const ACCEPT_GRADE_PERMISSION = Permission(
    Operation.TYPE.OUT,
    {
      type: Model.GRADE,
      course: _,
      date: _,
      student,
      grade: _,
      signature: student
    }
  )

  const role = Role([
    READ_COURSES_PERMISSION,
    ENROLL_PERMISSION,
    READ_SESSIONS_PERMISSION,
    TAKE_EXAM_PERMISSION,
    READ_RESULTS_PERMISSION,
    REJECT_GRADE_PERMISSION,
    ACCEPT_GRADE_PERMISSION
  ])

  return role
}

module.exports = { ADMINISTRATION_ROLE, PROFESSOR_ROLE, createStudentRole }
