const Mongo = require('mongodb')

const Linda = require('../../src/Linda')
const WILDCARD = Linda.Matcher.WILDCARD

const NOT_FOUND_ERROR = new Error('The requested tuple was not found.')

const mapTupleSchemataToQuery = schemata => {
  const query = { }
  Object.keys(schemata).forEach(key => {
    if (schemata[key] !== WILDCARD) {
      query[key] = schemata[key]
    }
  })
  return query
}

const MongoStore = (URL, mainCB) => {
  Mongo.connect(URL, (dbErr, db) => {
    if (dbErr) {
      return mainCB(dbErr)
    }

    const collection = db.collection('tuples')

    const store = {
      add (tuple, cb) {
        collection.insert(tuple, err => {
          if (err) {
            return cb(err)
          }
          delete tuple._id
          cb(undefined, tuple)
        })
      },
      remove (tuple, cb) {
        collection.deleteOne(tuple, (err, res) => {
          if (err) {
            return cb(err)
          }
          if (res.deletedCount === 0) {
            return cb(NOT_FOUND_ERROR)
          }
          cb(undefined, tuple)
        })
      },
      find (schemata, cb) {
        const query = mapTupleSchemataToQuery(schemata)
        collection.findOne(query, (err, doc) => {
          if (err) {
            return cb(err)
          }
          if (!doc) {
            return cb()
          }
          delete doc._id
          cb(undefined, doc)
        })
      },
      close () {
        db.close()
      }
    }
    mainCB(undefined, store)
  })
}

module.exports = MongoStore
