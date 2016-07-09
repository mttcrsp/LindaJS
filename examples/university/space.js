const Linda = require('../../src/Linda')
const Space = Linda.Space
const _ = Linda.Matcher.WILDCARD

const Roles = require('./roles')
const Model = require('./model')

const space = Space()

// This validator checks that the grade that the professor assigned is valid
// one, that is between 18 and 31.
const INVALID_GRADE_ERROR = new Error('This is not a grade you can assign. Valid grades are in the 18-31 range.')
const gradeValidator = (tuple, cb) => {
  if (tuple.type !== Model.GRADE) {
    return cb()
  }
  if (tuple.grade >= 18 && tuple.grade <= 31) {
    return cb()
  }
  cb(INVALID_GRADE_ERROR)
}

// This validator checks that when a signed vote is added the space contains a
// matching unsigned vote. (aka a student is trying to sneak a vote in)
const NO_UNSIGNED_ERROR = new Error('You never got assigned this grade! No cheating b****!') // You gotta show attitude.
const acceptGradeValidator = (newTuple, cb) => {
  if (newTuple.type !== Model.GRADE) {
    return cb()
  }
  // This means that this is not a signed grade, so you do not need to check
  // it.
  if (!newTuple.signature) {
    return cb()
  }
  space.search(
    newTuple,
    (err, matchingTuple) => {
      if (matchingTuple) {
        return cb()
      }
      cb(err || NO_UNSIGNED_ERROR)
    }
  )
}

space.addValidator(gradeValidator)
space.addValidator(acceptGradeValidator)

// This next funtions are constructor for the objects that our application will
// use. This is not strictly necessary as the rest of the application could
// also just interact with the tuple space directly with no problem at all.
// However it is nice to let the rest of the application interact with
// friendlier interface. (this also lets us change the tuple space
// implementation without breaking all of the application) These next functions
// accomplish just that, they simply map the appropriate agent operations to
// cleaner methods.

space.addRoles([Roles.ADMINISTRATION_ROLE, Roles.PROFESSOR_ROLE])

const Administration = () => {
  const agent = space.createAgent(Roles.ADMINISTRATION_ROLE)
  return {
    createCourse (id, cb) {
      const course = { type: Model.COURSE, id }
      agent.write(course, cb)
    }
  }
}

const Professor = () => {
  const agent = space.createAgent(Roles.PROFESSOR_ROLE)
  return {
    watchCourse (cb) {
      agent.read({
        type: Model.COURSE,
        id: _
      }, cb)
    },
    openSession (session, cb) {
      agent.write({
        type: Model.SESSION,
        course: session.course,
        date: session.date
      }, cb)
    },
    watchAssignment (session, cb) {
      agent.read({
        type: Model.ASSIGNMENT,
        course: session.course,
        date: session.date,
        student: _
      }, cb)
    },
    assignGrade (result, cb) {
      agent.write({
        type: Model.GRADE,
        course: result.course,
        date: result.date,
        student: result.student,
        grade: result.grade
      }, cb)
    },
    closeSession (session, cb) {
      agent.takeNow({
        type: Model.SESSION,
        course: session.course,
        date: session.date
      }, cb)
    }
  }
}

const Student = id => {
  const role = Roles.createStudentRole(id)
  space.addRoles([role])

  const agent = space.createAgent(role)

  const student = id
  return {
    watchCourse (cb) {
      agent.read({
        type: Model.COURSE,
        id: _
      }, cb)
    },
    enroll (course, cb) {
      agent.write({
        type: Model.ENROLL,
        course,
        student
      }, cb)
    },
    watchSession (course, cb) {
      agent.read({
        type: Model.SESSION,
        course,
        date: _
      }, cb)
    },
    takeExam (session, cb) {
      agent.write({
        type: Model.ASSIGNMENT,
        course: session.course,
        date: session.date,
        student
      }, cb)
    },
    watchResult (session, cb) {
      agent.read({
        type: Model.GRADE,
        course: session.course,
        date: session.date,
        student,
        grade: _
      }, cb)
    },
    acceptGrade (grade, cb) {
      agent.write({
        type: Model.GRADE,
        course: grade.course,
        date: grade.date,
        student,
        grade: grade.grade,
        signature: student
      }, cb)
    },
    rejectGrade (grade, cb) {
      agent.takeNow({
        type: Model.GRADE,
        course: grade.course,
        date: grade.date,
        student,
        grade: grade.grade
      }, cb)
    }
  }
}

// Finally these next two functions do clean up behind agents work. The first
// one removes an assignment from the space once a professor provides a grade
// for it. The second one removes the enrollment and unsigned grade from the
// space once a grade is accepted by a student.

space.onDidAdd((grade, cb) => {
  if (grade.type === Model.GRADE) {
    return space.search({
      type: Model.ASSIGNMENT,
      course: grade.course,
      date: grade.date,
      student: grade.student
    }, (err, assignment) => {
      if (err) {
        return cb(err)
      }
      if (assignment) {
        return space.remove(assignment, cb)
      }
      cb(new Error('No matching grade was found.'))
    })
  }
  cb()
})

space.onDidAdd((grade, cb) => {
  if (
    grade.type === Model.GRADE &&
    grade.signature !== undefined
  ) {
    return space.search({
      type: Model.GRADE,
      course: grade.course,
      date: grade.date,
      student: grade.student,
      grade: grade.grade
    }, (err, unsignedGrade) => {
      if (err) {
        return cb(err)
      }
      if (unsignedGrade) {
        return space.remove(unsignedGrade, cb)
      }
      cb(new Error('No matching grade was found.'))
    })
  }
  cb()
})

module.exports = { Administration, Professor, Student }
