const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const ejsMate = require('ejs-mate')
const Joi = require('joi')
const ExpressError = require('./utils/ExpressError')
const catchAsync = require('./utils/catchAsync')
const methodOverride = require('method-override')
const Article = require('./models/articles')

mongoose.connect('mongodb://localhost:27017/sunrise-press', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
  console.log('Database connected')
})

const app = express()

app.set('view engine', 'ejs')
app.engine('ejs', ejsMate)
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

const validateArticle = (req, res, next) => {
  const articleValidateSchema = Joi.object({
    article: Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
      content: Joi.string().required(),
      image: Joi.string().required(),
    }).required(),
  })

  const { error } = articleValidateSchema.validate(req.body)

  if(error) {
    const msg = error.details.map(el => el.message).join(',')
    next(new ExpressError(msg, 400)) 
  }else {
    next()
  }
}

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/articles', async (req, res) => {
  const articles = await Article.find()
  res.render('articles/index', { articles })
})

app.get('/articles/new', async (req, res) => {
  res.render('articles/new')
})

app.post(
  '/articles',
  validateArticle,
  catchAsync(async (req, res, next) => {
    const article = await new Article(req.body.article)
    await article.save()
    res.redirect(`/articles/${article.id}`)
  })
)

app.get(
  '/articles/:id',
  catchAsync(async (req, res) => {
    const article = await Article.findById(req.params.id)
    res.render('articles/show', { article })
  })
)

app.get(
  '/articles/:id/edit',
  catchAsync(async (req, res) => {
    const article = await Article.findById(req.params.id)
    res.render('articles/edit', { article })
  })
)

app.put(
  '/articles/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params
    const article = await Article.findByIdAndUpdate(id, req.body.article)
    res.redirect(`/articles/${article._id}`)
  })
)

app.delete(
  '/articles/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params
    await Article.findByIdAndDelete(id)
    res.redirect('/articles')
  })
)

app.all('*', (req, res, next) => {
  next(new ExpressError('Page Not found', 404))
})

app.use((err, req, res, next) => {
  const { message = 'Something went wrong', statusCode = 500 } = err
  res.status(statusCode).render('error', { message })
  next(err)
})

app.listen(3000, () => {
  console.log('Listening on port 3000')
})
