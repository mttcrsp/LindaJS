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

module.exports = { COURSE, STUDENT, ENROLL, SESSION, ASSIGNMENT, GRADE }
