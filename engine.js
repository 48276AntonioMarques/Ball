let balls = []
const MaxSpeed = 200
const restitution = 0.5
const borderSize = 10

// TODO: On balls overlapping each other resolution relocate further the ball that is farther from the wall

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)
const ctx = canvas.getContext('2d')

let field = {
    top: 10,
    left: 10,
    right: canvas.width - 20,
    bottom: canvas.height - 20
}

let lastUpdate = Date.now()
let lastFPScount = Date.now()
let fps = 0

let updateInterval = null

function resume() {
    lastUpdate = Date.now()
    updateInterval = setInterval(update, 1000 / 30) // 30 FPS
}

function pause() {
    clearInterval(updateInterval)
    updateInterval = null
}

function update() {
    // Update
    const deltaTime = (Date.now() - lastUpdate) / 1000
    canvas.height = document.documentElement.clientHeight
    canvas.width = document.body.clientWidth
    balls.forEach(ball => {
        // Update ball
        if (Math.abs(ball.xVelocity) > MaxSpeed) ball.xVelocity = Math.sign(ball.xVelocity) * MaxSpeed
        if (Math.abs(ball.yVelocity) > MaxSpeed) ball.yVelocity = Math.sign(ball.yVelocity) * MaxSpeed
        ball.move(ball.xVelocity * deltaTime, ball.yVelocity * deltaTime)
        if (ball.x < field.left || ball.x > field.right || ball.y < field.top || ball.y > field.bottom) {
            balls.splice(balls.indexOf(ball), 1)
            console.log('Ball out of bounds')
        }
    })

    // Render
    ctx.fillStyle = 'black'
    field.right = canvas.width - borderSize
    field.bottom = canvas.height - borderSize
    ctx.fillRect(field.top, field.left, field.right - field.left, field.bottom - field.top)
    balls.forEach(ball => {
        //Draw ball
        ctx.fillStyle = ball.color
        ctx.beginPath()
        ctx.ellipse(ball.x, ball.y, ball.radius, ball.radius, 0, 0, 2 * Math.PI)
        ctx.fill()
        /*
        ctx.strokeStyle = 'red'
        ctx.moveTo(ball.x, ball.y)
        ctx.lineTo(ball.x - ball.xVelocity, ball.y - ball.yVelocity)
        ctx.stroke()
        */
    })
    if (Date.now() - lastFPScount > 200) {
        fps = Math.round(1000 / (Date.now() - lastUpdate))
        lastFPScount = Date.now()
    }
    ctx.font = '20px Arial'
    ctx.fillStyle = 'white'
    lastUpdate = Date.now()
    ctx.fillText("FPS: " + fps, 10, 30)
}

addEventListener('click', event => {
    balls.push(new Ball(event.clientX, event.clientY, 20))
})

addEventListener('keypress', event => {
    if (event.key === ' ') {
        if (updateInterval) {
            pause()
            console.log('Paused')
        }
        else {
            resume()
            console.log('Resumed')
        }
    }
})

let spawnerInterval = null

addEventListener('keydown', event => {
    if (event.key === 's') {
        if (spawnerInterval == null) {
            spawnerInterval = setInterval(() => {
                balls.push(new Ball(Math.random() * (field.right - field.left) + field.left, Math.random() * (field.bottom - field.top) + field.top, 20))
            }, 100)
        }
    }
})

addEventListener('keyup', event => {
    if (event.key === 's') {
        clearInterval(spawnerInterval)
        spawnerInterval = null
    }
})

function randomColor() {
    let r = Math.round(Math.random() * 128 + 127)
    let g = Math.round(Math.random() * 128 + 127)
    let b = Math.round(Math.random() * 128 + 127)
    return `rgba(${r}, ${g}, ${b}, 1)`
}


class Ball {
    constructor(x, y, radius) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = randomColor()
        this.xVelocity = Math.random() * MaxSpeed * 2 - MaxSpeed
        this.yVelocity = Math.random() * MaxSpeed * 2 - MaxSpeed
    }

    move(xVelocity, yVelocity) {
        // Check for collisions
        // Bounce off walls
        const nextX = this.x + xVelocity
        const nextY = this.y + yVelocity
        if (
            (xVelocity < 0 && nextX - this.radius <= field.left) ||
            (xVelocity > 0 && nextX + this.radius >= field.right)
        ) {
            // Go to the wall and move the rest in the opposite direction
            this.xVelocity *= -1
            const distanceToClosestWall = 
                Math.min(Math.abs(this.x - this.radius - field.left), Math.abs(this.x + this.radius - field.right))
            this.x += -xVelocity - distanceToClosestWall
        }
        else {
            this.x += xVelocity
        }
        // Bounce off ceiling and floor
        if (
            (yVelocity < 0 && nextY - this.radius <= field.top) ||
            (yVelocity > 0 && nextY + this.radius >= field.bottom)
        ) {
            // Go to the wall and move the rest in the opposite direction
            this.yVelocity *= -1
            const distanceToClosestWall = 
                Math.min(Math.abs(this.y - this.radius - field.top), Math.abs(this.y + this.radius - field.bottom))
            this.y += -yVelocity - distanceToClosestWall
        }
        else {
            this.y += yVelocity
        }

        // Bounce off other balls
        balls.forEach (ball => {
            if (ball === this) return
            const distance = Math.sqrt(Math.pow(this.x - ball.x, 2) + Math.pow(this.y - ball.y, 2))
            if (distance < this.radius + ball.radius) {
                // Collision

                const distance = {
                    x: this.x - ball.x,
                    y: this.y - ball.y
                }

                const distanceLength = Math.sqrt(Math.pow(distance.x, 2) + Math.pow(distance.y, 2))

                const minimumTranslationDistance = {
                    x: distance.x * (((this.radius + ball.radius) - distanceLength) / distanceLength),
                    y: distance.y * (((this.radius + ball.radius) - distanceLength) / distanceLength)
                }

                // Move the balls apart so they don't overlap
                const horizontalViewport = (this.x - field.left) / (field.right - field.left)
                const invertedHorizontalViewport = 1 - horizontalViewport
                if (this.x < ball.x && horizontalViewport < 0.5) {
                    // This ball is closer to the left wall move more the other ball
                    this.x += minimumTranslationDistance.x * horizontalViewport
                    ball.x += minimumTranslationDistance.x * invertedHorizontalViewport
                }
                else {
                    // This ball is closer to the right wall move more the other ball
                    this.x += minimumTranslationDistance.x * invertedHorizontalViewport
                    ball.x += minimumTranslationDistance.x * horizontalViewport
                }

                const verticalViewport = (this.y - field.top) / (field.bottom - field.top)
                const invertedVerticalViewport = 1 - verticalViewport
                if (this.y < ball.y && verticalViewport < 0.5) {
                    // This ball is closer to the top wall move more the other ball
                    this.y += minimumTranslationDistance.y * verticalViewport
                    ball.y += minimumTranslationDistance.y * invertedVerticalViewport
                }
                else {
                    // This ball is closer to the bottom wall move more the other ball
                    this.y += minimumTranslationDistance.y * invertedVerticalViewport
                    ball.y += minimumTranslationDistance.y * verticalViewport
                }

                const minimumTranslationDistanceLength = Math.sqrt(Math.pow(minimumTranslationDistance.x, 2) + Math.pow(minimumTranslationDistance.y, 2))
                
                const minimumTranslationDistanceNormalized = {
                    x: minimumTranslationDistance.x / minimumTranslationDistanceLength,
                    y: minimumTranslationDistance.y / minimumTranslationDistanceLength
                }

                const velocity = {
                    x: this.xVelocity - ball.xVelocity,
                    y: this.yVelocity - ball.yVelocity
                }

                const velocityNormalized = {
                    x: velocity.x * minimumTranslationDistanceNormalized.x,
                    y: velocity.y * minimumTranslationDistanceNormalized.y
                }

                const velocityDotProduct = velocityNormalized.x * velocity.x + velocityNormalized.y * velocity.y

                if(velocityDotProduct > 0) return

                const i = (-(1 + restitution) * velocityDotProduct) / 1000

                const impulse = {
                    x: minimumTranslationDistanceNormalized.x * i,
                    y: minimumTranslationDistanceNormalized.y * i
                }

                console.log({
                    i,
                    velocityDotProduct,
                    impulse,
                    velocityNormalized,
                    minimumTranslationDistanceNormalized,
                    velocity,
                })

                this.xVelocity += impulse.x
                this.yVelocity += impulse.y

                ball.xVelocity -= impulse.x
                ball.yVelocity -= impulse.y
            }
        })
    }
}

resume()