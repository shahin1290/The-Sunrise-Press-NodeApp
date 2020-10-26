const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ArticleSchema = new Schema({
  title: String,
  description: String,
  content: String,
  image: String,
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ]
})

module.exports = mongoose.model('Article', ArticleSchema) 