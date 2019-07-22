const io = require('socket.io')
const CronJob = require('cron').CronJob

const reddit = require('./reddit')
const jobTime = require('./config/jobTime')
const LastUpdates = require('./schemas/LastUpdates')

let socket

const getSubmissions = async name => {
  const user = await reddit.getUser(name)
  const submissions = await user.getSubmissions({ limit: 1 })
  if (submissions.length > 0) return submissions[0]
  return null
}
const persistLastUpdates = async (submission, subreddit, isSubmissions = false) => {
  await LastUpdates.deleteMany({ subredditId: subreddit.id, isSubmissions })
  await LastUpdates.create({
    submissionId: submission.id,
    submissionUrl: submission.url,
    subredditId: subreddit.id,
    isSubmissions
  })
}
const hasLastUpdates = async (submissionId, subredditId) => {
  const lastSubmission = await LastUpdates.findOne({ submissionId, subredditId })
  return lastSubmission && (lastSubmission.length > 0 || lastSubmission._id)
}

const jobFn = async () => {
  const subs = await reddit.getSubscriptions()
  if (subs && Array.isArray(subs) && subs.length > 0) {
    subs.forEach(async sub => {
      if (sub.url.match(/\/user\//)) {
        const submission = await getSubmissions(sub.display_name_prefixed)
        if (submission) {
          if (!await hasLastUpdates(submission.id, sub.id)) {
            onRedditUpdates(socket, submission, sub)
            await persistLastUpdates(submission, sub, true)
            console.log(
              new Date(submission.created_utc * 1000).toString() + '--->' + sub.url + '===' + submission.id + '--->getSubmissions',
              submission.url
            )
          }
        }
      }
      const newSubmissions = await sub.getNew({ limit: 1 })
      if (newSubmissions.length > 0) {
        if (!await hasLastUpdates(newSubmissions[0].id, sub.id)) {
          onRedditUpdates(socket, newSubmissions[0], sub)
          await persistLastUpdates(newSubmissions[0], sub)
          console.log(
            new Date(newSubmissions[0].created_utc * 1000).toString() + '--->' + sub.url + '--->' + newSubmissions[0].id + '--->getNew',
            newSubmissions[0].url
          )
        }
      }
    })
  }
}

const onRedditUpdates = (socket, submission, sub) => {
  if (socket) {
    socket.emit('onRedditUpdates', {
      url: submission.url,
      name: sub.display_name_prefixed,
      reddit: `https://reddit.com/${sub.display_name_prefixed}`
    })
  }
}

const onDisconnect = () => {
  console.log('user disconnected')
}
const onGetSubscriptions = async (_, fn) => {
  try {
    const subs = await reddit.getSubscriptions()
    if (subs && Array.isArray(subs) && subs.length > 0) {
      const ret = subs.map(sub => ({
        id: sub.id,
        link: `https://reddit.com/${sub.url}`,
        description: sub.public_description,
        name: sub.display_name,
        image: sub.icon_img
      }))
      fn(ret, null)
    } else {
      fn(null, { message: 'Você não segue ninguem ainda' })
    }
  } catch (err) {
    fn(null, err)
  }
}
const onSubscribe = async (name, fn) => {
  console.log('user: ' + name)
  try {
    const sub = await reddit.getSubreddit(name).subscribe()
    fn({
      name: await sub.display_name,
      image: await sub.icon_img,
      link: `https://reddit.com/${name}`
    }, null)
  } catch (err) {
    fn(null, err)
  }
}
const onUnSubscribe = async (name, fn) => {
  console.log('user: ' + name)
  try {
    const sub = await reddit.getSubreddit(name).unsubscribe()
    fn({
      name: await sub.display_name,
      image: await sub.icon_img,
      link: `https://reddit.com/${name}`
    }, null)
  } catch (err) {
    fn(null, err)
  }
}
const onConnection = socket => {
  console.log('a user connected: ' + socket.id)
  socket.on('subscribe', onSubscribe)
  socket.on('unsubscribe', onUnSubscribe)
  socket.on('subscriptions', onGetSubscriptions)
  socket.on('disconnect', onDisconnect)
}

const job = new CronJob(jobTime, jobFn, null, true, 'UTC')
module.exports = {
  init: http => {
    socket = io(http)
    socket.on('connection', onConnection)
  }
}
