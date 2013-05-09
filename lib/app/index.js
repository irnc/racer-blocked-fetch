var derby = require('derby')
derby.use(require('../../ui'))
var app = derby.createApp(module)
  , get = app.get
  , view = app.view
  , ready = app.ready
  , start = +new Date()



// ROUTES //

// Derby routes can be rendered on the client and the server
get('/:roomName?', function(page, model, params) {
  var roomName = params.roomName || 'home'

  /*
   * First set operation to non-private path will be added to transaction
   * queue, second set operation to private path will be also added to queue
   * because it is not empty. This means that the second operation will not be
   * applied on model immediately.
   *
   * After receiving ack for the first transaction, second one will not be
   * executed, and speculative model will not be generated, as a result
   * this transaction will be still in queue. And `fetch` will wait till queue
   * will be empty - so endless waiting.
   *
   * This is not the case with subscription, but present only when using fetch
   * and when queue has transaction to private path after one for non-private.
   */
  model.set('rooms.test.prop', 1)
  model.set('_bar', 1)

  // Subscribes the model to any updates on this room's object. Calls back
  // with a scoped model equivalent to:
  //   room = model.at('rooms.' + roomName)
  model.fetch('rooms.' + roomName, function(err, room) {
    model.ref('_room', room)

    // setNull will set a value if the object is currently null or undefined
    room.setNull('welcome', 'Welcome to ' + roomName + '!')

    room.incr('visits')

    // This value is set for when the page initially renders
    model.set('_timer', '0.0')
    // Reset the counter when visiting a new route client-side
    start = +new Date()

    // Render will use the model data as well as an optional context object
    page.render({
      roomName: roomName
    , randomUrl: parseInt(Math.random() * 1e9).toString(36)
    })
  })
})


// CONTROLLER FUNCTIONS //

ready(function(model) {
  var timer

  // Functions on the app can be bound to DOM events using the "x-bind"
  // attribute in a template.
  this.stop = function() {
    // Any path name that starts with an underscore is private to the current
    // client. Nothing set under a private path is synced back to the server.
    model.set('_stopped', true)
    clearInterval(timer)
  }

  this.start = function() {
    model.set('_stopped', false)
    timer = setInterval(function() {
      model.set('_timer', (((+new Date()) - start) / 1000).toFixed(1))
    }, 100)
  }
  this.start()

})
