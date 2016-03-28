const Linda = require('../../src/Linda')
const Space = Linda.Space
const Operation = Linda.Operation
const Permission = Linda.Permission
const Role = Linda.Role
const Pattern = Linda.Pattern
const _ = Pattern.WILDCARD

const space = Space()

// The data model used by this example is the following. This means that each
// tuple in the space will use one of this models.

const COURSE = 'course'
// COURSE = {
//     type: 'course',
//     id: 0
// }

const STUDENT = 'student'
// STUDENT = {
//     type: 'student',
//     id: 0
// }

const ENROLL = 'enroll'
// ENROLL = {
//     type: 'enrollment',
//     course: COURSE,
//     student: STUDENT
// }

const SESSION = 'session'
// SESSION = {
//     type: 'session',
//     ...COURSE,
//     date: '16/12/16'
// }

const ASSIGNMENT = 'assignment'
// ASSIGNMENT = {
//     type: 'assignment',
//     ...SESSION
//     ...STUDENT
// }

const GRADE = 'grade'
// GRADE = {
//     type: 'grade',
//     ...ASSIGNMENT
//     grade: 30
// }
// ACCEPTED_GRADE = {
//     ...GRADE
//     signature: STUDENT
// }

// This validator checks that the grade that the professor assigned is valid
// one, that is between 18 and 31.
const gradeValidator = tuple => {
    if (tuple.type !== GRADE) {
        return true
    }
    return tuple.grade < 18 || tuple.grade > 31
}

// This validator checks that when a signed vote is added the space contains a
// matching unsigned vote. (aka a student is trying to sneak a vote in)
const acceptGradeValidator = newTuple => {
    if (newTuple.type !== GRADE) {
        return true
    }
    const tuples = space.getTuples()
    return tuples.contains(tuple => (
        tuple.student === newTuple.student &&
        tuple.course === newTuple.course &&
        tuple.grade === newTuple.grade
    ))
}

space.addValidator(gradeValidator)
space.addValidator(acceptGradeValidator)

// The administration can only create courses, this corresponds to adding a new
// course tuple to the space using the format specified above.

const CREATE_COURSE_PERMISSION = Permission(
    Operation.TYPE.OUT, { type: COURSE, id: _ }
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
    { type: COURSE, id: _ }
)
const OPEN_SESSION_PERMISSION = Permission(
    Operation.TYPE.OUT,
    { type: SESSION, course: _, date: _ }
)
const CLOSE_SESSION_PERMISSION = Permission(
    Operation.TYPE.IN,
    { type: SESSION, course: _, date: _ }
)
const READ_ASSIGNMENTS_PERMISSION = Permission(
    Operation.TYPE.RD,
    { type: ASSIGNMENT, course: _, date: _, student: _ }
)
const ASSIGN_GRADE_PERMISSION = Permission(
    Operation.TYPE.OUT,
    { type: GRADE, course: _, date: _, student: _, grade: _ }
)

const PROFESSOR_ROLE = Role([
    READ_COURSES_PERMISSION,
    OPEN_SESSION_PERMISSION,
    READ_ASSIGNMENTS_PERMISSION,
    ASSIGN_GRADE_PERMISSION,
    CLOSE_SESSION_PERMISSION
])

space.addRoles([ADMINISTRATION_ROLE, PROFESSOR_ROLE])

// The creation of a student role and permissions is a bit more complex as a
// student should only be able to interact with tuples that specify his/her id.
// However we do not know yet the student id. This problem can be solved by
// deferring the creation of a student role and permissions up until the
// creation of the student agent itself, when we will know its id. This next
// function accomplishes exactly that: when we know they student id this
// function will create a new role for the student with the right permissions
// and add it to the space.

const createStudentRole = id => {
    const student = { type: STUDENT, id }

    const ENROLL_PERMISSION = Permission(
        Operation.TYPE.OUT,
        { type: 'enrollment', course: _, student }
    )
    const READ_SESSIONS_PERMISSION = Permission(
        Operation.TYPE.RD,
        { type: SESSION, course: _, date: _ }
    )
    const TAKE_EXAM_PERMISSION = Permission(
        Operation.TYPE.OUT,
        { type: ASSIGNMENT, course: _, date: _, student }
    )
    const READ_RESULTS_PERMISSION = Permission(
        Operation.TYPE.RD,
        { type: GRADE, course: _, date: _, student, grade: _ }
    )
    const REJECT_GRADE_PERMISSION = Permission(
        Operation.TYPE.INP,
        { type: GRADE, course: _, date: _, student, grade: _ }
    )
    const ACCEPT_GRADE_PERMISSION = Permission(
        Operation.TYPE.OUT,
        {
            type: GRADE,
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

    // Add role to the space
    space.addRoles([role])

    return role
}

// This next funtions are constructor for the objects that our application will
// use. This is not strictly necessary as the rest of the application could
// also just interact with the tuple space directly with no problem at all.
// However it is nice to let the rest of the application interact with
// friendlier interface. (this also lets us change the tuple space
// implementation without breaking all of the application) These next functions
// accomplish just that, they simply map the appropriate agent operations to
// cleaner methods. (WARNING: This is some of the ugliest code you'll ever see.
// I'll clean it up when I have the time to do so...)

const Administration = () => {
    const agent = space.createAgent(ADMINISTRATION_ROLE)
    return {
        createCourse (id, cb) {
            const course = { type: COURSE, id }
            agent.out(course, cb)
        }
    }
}

const Professor = () => {
    const agent = space.createAgent(PROFESSOR_ROLE)
    return {
        watchCourses(cb) {
            agent.rd({
                type: COURSE,
                id: _
            }, cb)
        },
        openSession(session, cb) {
            agent.out({
                type: SESSION,
                course: session.course,
                date: session.date
            }, cb)
        },
        watchAssignments (session, cb) {
            agent.rd({
                type: ASSIGNMENT,
                course: session.course,
                date: session.date,
                student: _
            }, cb)
        },
        assignGrade(result, cb) {
            agent.out({
                type: GRADE,
                course: result.course,
                date: result.date,
                student: result.student,
                grade: result.grade
            }, cb)
        },
        closeSession(session, cb) {
            agent.inp({
                type: SESSION,
                course: session.course,
                date: session.date
            }, cb)
        }
    }
}

const Student = id => {
    const studentRole = createStudentRole(id)
    const agent = space.createAgent(studentRole)

    const student = { type: STUDENT, id }
    return {
        watchCourses (cb) {
            agent.rd({
                type: COURSE,
                id: _
            }, cb)
        },
        enroll (course, cb) {
            agent.out({
                type: ENROLL,
                course,
                student
            }, cb)
        },
        watchSessions (course, cb) {
            agent.rd({
                type: SESSION,
                course,
                date: _
            }, cb)
        },
        takeExam (session, cb) {
            agent.out({
                type: ASSIGNMENT,
                course: session.course,
                date: session.date,
                student
            }, cb)
        },
        watchResults (session, cb) {
            agent.rd({
                type: GRADE,
                course: session.course,
                date: session.date,
                student,
                grade: _
            }, cb)
        },
        acceptGrade (grade, cb) {
            agent.out({
                type: GRADE,
                course: grade.course,
                date: grade.date,
                student,
                grade: grade.grade,
                signature: student
            }, cb)
            console.log(space.getTuples())
        },
        rejectGrade (grade, cb) {
            agent.inp({
                type: GRADE,
                course: grade.course,
                date: grade.date,
                student,
                grade: grade.grade
            }, cb)
            console.log(space.getTuples())
        }
    }
}

module.exports = { Administration, Professor, Student }
