'use strict'

/**
 * Color values used frequently
 */
var Colors = {
  black: "#000000",
  grey: "#a0a0a0",
  red: "#ff0000",
  green: "#00ff00",
}
/**
 * The way a rectangle should be drawn
 */
var Draw = {
  STROKE: 0,
  FILL: 1,
}

/**
 * Default Settings
 */
var Defaults = {
  canvasNode: "demo", // name of node to create demo
  sizeIncrement: 10, // amount each bar will be incremented by each time
  rate: 100, // the time between of each increment
  number: 5, // the number of bars in the demo
  barrierSpec: { // how the barrier should appear
    x: 1, // x position
    y: 210, // y position
    width: 240, // barier width
    height: 2, // barier height/thickness
    color: Colors.black, // barier color
  },
  barSpec: { // how each bar should appear
    offset: 10, // an offset from the top left corner (useful when changing the thickness of the bars strokes)
    width: 20, // width of each bar
    height: 300, // height of each bar
    seperation: 30, // size of the gap between each bar
    cempty: Colors.grey, // a bars empty color
    cfull: Colors.green, // a bars full color
    cstroke: Colors.black, // a bars stroke color
    cwait: Colors.red, // the color of the bar when blocked by barrier
    strokeWidth: 2, // the width of a bars outline
    barrierAt: 200, // where the bars expect the barrier to be
  },
  phaseOne: { // configuration for the first phase
    hasBarrier: true, // whether or not to render the barrier
    maxFill: 200, // the point at which a bar becomes blocked
  },
  phaseTwo: { // configuration for the second phase
    hasBarrier: false, // whether or not to render the barrier
    maxFill: 300, // the new maxamum
    pause: 200, // the pause between the first and second phase
  },
}

/**
 * A rectangle which encapsulates a draw function
 * @param {number} x x ordinate of top left corner
 * @param {number} y y ordinate of top left corner
 * @param {number} width the width of the rectangle
 * @param {number} height the height of the rectangle
 * @param {string} color the rectangle's color
 * @param {Draw} type whether the rectangle is a stroke or fill
 * @param {?number} strokeWidth the width of the rectangle's lines, if type = Draw.STROKE
 */
function Rect(x, y, width, height, color, type, strokeWidth){
  this.x = x
  this.y = y
  this.width = width
  this.height = height
  this.color = color
  this.type = type
  this.strokeWidth = strokeWidth
}
/**
 * Draws the rectangle
 * @param {CanvasRenderingContext2D} ctx canvas' context @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
 */
Rect.prototype.draw = function(ctx){
  switch (this.type){
    case Draw.STROKE:
      ctx.strokeStyle = this.color
      ctx.lineWidth = this.strokeWidth
      ctx.strokeRect(this.x, this.y, this.width, this.height)
      break
    case Draw.FILL:
      ctx.fillStyle = this.color
      ctx.fillRect(this.x, this.y, this.width, this.height)
      break
  }
}

/**
 * Clears the rectangle
 * @param {CanvasRenderingContext2D} ctx canvas' context @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
 */
Rect.prototype.clear = function(ctx){
  switch (this.type){
    case Draw.STROKE: // remember the stroke is not inside the rectangle
      ctx.clearRect(this.x - this.strokeWidth/2, this.y - this.strokeWidth/2, this.width + this.strokeWidth, this.strokeWidth)
      ctx.clearRect(this.x - this.strokeWidth/2, this.y - this.strokeWidth/2 + this.height, this.width + this.strokeWidth, this.strokeWidth)
      ctx.clearRect(this.x - this.strokeWidth/2, this.y - this.strokeWidth/2, this.strokeWidth, this.height + this.strokeWidth)
      ctx.clearRect(this.x - this.strokeWidth/2 + this.width, this.y - this.strokeWidth/2, this.strokeWidth, this.height + this.strokeWidth)
      break
    case Draw.FILL:
      ctx.clearRect(this.x, this.y, this.width, this.height)
      break
  }
}

/**
 * A bar which can be filled
 * @param {Rect} stroke the rectangle arount the edges
 * @param {Rect} fill the rectangle representing the empty contents
 * @param {number} maxFill the limit the bar can be filled to
 * @param {string} [cfull] the color of the filled portion of the bar when running
 * @param {string} [cwait] the color of the filled portion of the bar when blocked
 */
function Bar(stroke, fill, maxFill, cfull = Colors.green, cwait = Colors.red){
  this.strokeRect = stroke
  this.fillRect = fill
  this.currentFill = 0
  this.maxFill = maxFill
  this.fillColor = cfull
  this.waitingColor = cwait
}
/**
 * Draws the bar
 * @param {CanvasRenderingContext2D} ctx canvas' context @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
 */
Bar.prototype.draw = function(ctx){
  this.strokeRect.draw(ctx)
  this.fillRect.draw(ctx)

  if (this.currentFill == this.maxFill){
    ctx.fillStyle = this.waitingColor
  } else {
    ctx.fillStyle = this.fillColor
  }
  ctx.fillRect(this.fillRect.x, this.fillRect.y, this.fillRect.width, this.currentFill)
}

/**
 * Replaces the bars max fill with the supplied value
 * @param {number} newMaxFill the new max fill of the bar
 */
Bar.prototype.setMaxFill = function(newMaxFill){
  this.maxFill = newMaxFill
}

/**
 * Fill the bar up by a given amount, note the bar cannot be over filled this way
 * (to force fill the bar over it's maxFill, use @link Bar.setCurrentFill)
 * @param {number} ammtBy the amount to fill the bar by
 */
Bar.prototype.fill = function(ammtBy){
  if (this.currentFill > this.maxFill - ammtBy){
    this.currentFill = this.maxFill
    return
  }
  this.currentFill += ammtBy
}
/**
 * replace the current fill with the given one
 * @param {number} newFill the new current fill
 */
Bar.prototype.setCurrentFill = function(newFill){
  this.currentFill = newFill
}

/**
 * Factory for creating bars
 * @param {number} [number] number of bars to make
 * @param {number} [maxFill] maxamum fill of the bars
 * @param {Object} [barSpec] specification for the bars
 */
var BarFactory = function(number = Defaults.number, maxFill = Defaults.phaseOne.maxFill, barSpec = Defaults.barSpec){
  this.number = number
  this.maxFill = maxFill
  this.barSpec = barSpec
}
/**
 * replaces the number of bars to make with the given one
 * @param {number} n new number of bars
 */
BarFactory.prototype.setNumber = function(n){
  this.number = n
}
/**
 * replaces the maxamum fill of the bars with the given one
 * @param {number} mf new max fill
 */
BarFactory.prototype.setMaxFill = function(mf){
  this.number = mf
}
/**
 * replace the barSpec with the given spec
 * @param {Object} spec
 */
BarFactory.prototype.setAllSpec = function(spec){
  this.barSpec = spec
}
/**
 * sets a given entry of barSpec to a given value
 * @param {string} specName name of the entry to replace
 * @param specValue value to replace the old entry's value with
 */
BarFactory.prototype.setSpecValue = function(specName, specValue){
  this.barSpec[specName] = specValue
}
/**
 * make a number of bars
 * @return {Bar[]} bars
 */
BarFactory.prototype.make = function(){
  var bars = []
  for (var i = 0; i < this.number; i++){
    bars.push(new Bar(new Rect(this.barSpec.offset + ((this.barSpec.seperation + this.barSpec.width) * i) - this.barSpec.strokeWidth/2,
                               this.barSpec.offset - this.barSpec.strokeWidth/2,
                               this.barSpec.width + this.barSpec.strokeWidth,
                               this.barSpec.height + this.barSpec.strokeWidth,
                               this.barSpec.cstroke,
                               Draw.STROKE,
                               this.barSpec.strokeWidth),
                      new Rect(this.barSpec.offset + ((this.barSpec.seperation + this.barSpec.width) * i),
                               this.barSpec.offset,
                               this.barSpec.width,
                               this.barSpec.height,
                               this.barSpec.cempty,
                               Draw.FILL),
                      this.maxFill,
                      this.barSpec.cfull,
                      this.barSpec.cwait
                    ))
  }
  return bars
}

/**
 * sets up a given phase
 * @param {CanvasRenderingContext2D} ctx canvas' context @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
 * @param {number} phase the phase to set up
 * @param {Bar[]} bars the bars to prepare
 * @param {Rect} barrier the barrier to prepare
 */
function setup(ctx, phase, bars, barrier){

  switch(phase){
    case 1:
    bars.forEach(function(bar){
      bar.setCurrentFill(0)
      bar.setMaxFill(Defaults.phaseOne.maxFill)
    })
      break;
    case 2:
      bars.forEach(function(bar){
        bar.setMaxFill(Defaults.phaseTwo.maxFill)
      })
      barrier.clear(ctx)
      break;
    default:
      break;
  }

  bars.forEach(function(bar){
    bar.draw(ctx)
  })

  switch(phase){
    case 1:
      barrier.draw(ctx)
      break;
    case 2:
      break;
    default:
      break;
  }
}

/**
 * Random number generator
 * @param {number} max upper bound for number generated
 * @return {number} integer in range 0 <= i < max
 */
function randInt(max){
  return Math.floor(Math.random() * max)
}

/**
 * Intervals set during phases
 */
var Intervals = []

/**
 * Timeouts set during phases
 */
var Timeouts = []

/**
 * A phase of the demo
 * @param {Bar[]} bars
 * @param {Rect} barrier
 * @param {context} ctx
 * @param {boolean} hasBarrier
 * @param {function(any): null} [callback] called on completion of phase
 * @param {number} rate the time between of each increment
 * @param {number} sizeIncrement  amount each bar will be incremented by each time
 * @param {any} [callbackParams] passed to callback
 */
function Phase(bars, barrier, ctx, hasBarrier, rate, sizeIncrement, callback = function(){}, callbackParams = null) {
  var _this = this // so this can be accessed withing setInterval

  _this.bars = bars
  _this.rate = rate
  _this.sizeIncrement = sizeIncrement
  _this.callback = callback
  _this.callbackParams = callbackParams

  _this.interval = setInterval(function(){
    if (_this.bars.length == 0){
      clearInterval(_this.interval)
      _this.callback(callbackParams)
      return
    }
    var rand = randInt(_this.bars.length)
    _this.bars[rand].fill(_this.sizeIncrement)
    _this.bars.forEach(function(bar){
      bar.draw(ctx)
      if (hasBarrier){
        barrier.draw(ctx)
      }
    })
    if (_this.bars[rand].currentFill == _this.bars[rand].maxFill){ // remove full bars from list
      _this.bars.splice(rand, 1)
    }
  }, _this.rate)
  Intervals.push(_this.interval)
}

/**
 * clears all running intervals and timeouts from any Phase
 */
function stop(){
  Intervals.forEach(function(i){
    clearInterval(i)
  })
  Timeouts.forEach(function(t){
    clearTimeout(t)
  })
}

/**
 * Objects to be drawn as part of the demo
 */
var Drawables = {
  bars: new BarFactory().make(),
  barrier: new Rect(Defaults.barrierSpec.x,
                         Defaults.barrierSpec.y,
                         Defaults.barrierSpec.width,
                         Defaults.barrierSpec.height,
                         Defaults.barrierSpec.color,
                         Draw.FILL),
}

/**
 * Draws the initial state
 */
function preStart(){
  setup(document.getElementById(Defaults.canvasNode).getContext("2d"),
        1, Drawables.bars, Drawables.barrier)
}

/**
 * Starts the demo
 */
function start(){
  stop()

  var one = Drawables.bars.slice()
  var two = Drawables.bars.slice()

  var ctx = document.getElementById(Defaults.canvasNode).getContext("2d")
  setup(ctx, 1, one, Drawables.barrier)
  new Phase(one, Drawables.barrier, ctx, Defaults.phaseOne.hasBarrier,
            Defaults.rate, Defaults.sizeIncrement, function(){
              Timeouts.push(setTimeout(function(){
                setup(ctx, 2, two, Drawables.barrier)
                new Phase(two, Drawables.barrier, ctx,
                          Defaults.phaseTwo.hasBarrier, Defaults.rate,
                          Defaults.sizeIncrement, function(){})
              }, Defaults.phaseTwo.pause))
  })
}
