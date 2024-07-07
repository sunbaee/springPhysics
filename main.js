class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    Mag() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    MagSqrd() {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    }

    Add(vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    Subtract(vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    Mult(value) {
        return new Vector(this.x * value, this.y * value);
    }

    Normalized() {
        if (this.x == 0 && this.y == 0) return new Vector();

        const vec = new Vector(this.x, this.y);
        return new Vector(this.x / vec.Mag(), this.y / vec.Mag());
    }
}

// HTML config

function UpdateLabelValues() {
    const slidersLis = document.querySelectorAll(".sliderLi");

    slidersLis.forEach(element => {
        var sliderValue = element.querySelector(".slider").value;
        var sliderLabel = element.querySelector("label span");
        sliderLabel.innerText = sliderValue;
    });
}

document.addEventListener("dragstart", e => {
    e.preventDefault();
});

// Physics

const Sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const square = document.querySelector("#square");
const ground = document.querySelector(".ground");
const spring = document.querySelector(".spring");

// Default height;
const dWidth = 1880;
const dHeight = 940;

// Object config
const startPosition = new Vector(innerWidth / 2, innerHeight * 1 / 4);
const sqrHalfSize = Math.round(window.innerHeight / 100 * 3);
const sqrMass = 5; // kg

// Mouse push
const sqrPushRadius = sqrHalfSize * 2;

// Natural constants
const gravity = 980; // value per frame ("cm")

// Spring force
const eConst = 50; // n / D;

const collisionDamping = (1 - 0.6); 
const collisionAcc = 0.65 * gravity;
const cineticAcc = 0.25 * gravity;

// Time config
const MS_CONVERSOR = 0.001; // converts ms to seconds
const FRAME_TIME = 16; // ms

// Object variables
var sqrAcc = new Vector();
var sqrVel = new Vector();
var sqrPos = new Vector();

var mPos = new Vector();

var hasGround = true;
var isPushing;

var springPos;
var groundY;

var resParse = new Vector(window.innerWidth / dWidth, window.innerHeight / dHeight);

// PX related
var velPerDist = 10 * resParse.y; //0.07; 
var baseSpringSize = 300 * resParse.y; //px

// Errors
var V_ERROR = new Vector(10 * resParse.x, 100 * resParse.y);

window.onmousedown = e => {
    mPos = new Vector(e.clientX, e.clientY);

    const distVec = mPos.Subtract(sqrPos);
    if (distVec.MagSqrd() <= Math.pow(sqrPushRadius, 2)) isPushing = true;
}

window.onmousemove = e => {
    if (!isPushing) return;

    mPos = new Vector(e.clientX, e.clientY);
}

window.onmouseup = () => {
    if (!isPushing) return;

    isPushing = false;
}

function DisableGround(element) {
    hasGround = element.checked;
    
    ground.style.opacity = hasGround ? 1 : 0;
}

function SetPositions() {
    springPos = new Vector(spring.getBoundingClientRect().x, spring.getBoundingClientRect().y);
    groundY = ground.getBoundingClientRect().bottom;

    resParse = new Vector(window.innerWidth / dWidth, window.innerHeight / dHeight)
}

function PushSquare() {
    if (!isPushing) return;

    return mPos.Subtract(sqrPos).Mult(velPerDist);
}

function SpringPush() {
    const springVec = sqrPos.Subtract(springPos);
    const springAcc = -(eConst * (springVec.Mag() - baseSpringSize)) / sqrMass;

    return springVec.Normalized().Mult(springAcc);
}

function DetectCollision(nextPos, deltaTime) {
    if (nextPos.y + sqrHalfSize >= groundY && hasGround) {
        sqrPos.y = groundY - sqrHalfSize;
        
        if (sqrVel.y <= V_ERROR.y) sqrVel.x += -Math.sign(sqrVel.x) * cineticAcc * deltaTime;
        else sqrVel.x += -Math.sign(sqrVel.x) * collisionAcc * deltaTime;

        sqrVel.y = -Math.abs(sqrVel.y) * collisionDamping;
        
        if (Math.abs(sqrVel.y) - gravity * deltaTime <= V_ERROR.y) sqrVel.y = 0;
        if (Math.abs(sqrVel.x) <= V_ERROR.x) sqrVel.x = 0;
    }
}

function MoveSquare(sqrPos, frameTime) {
    square.animate({
        transform: `translateX(${ sqrPos.x }px)
                    translateY(${ sqrPos.y }px)`
    }, {
        duration: frameTime,
        fill: "forwards"
    });
}

async function Process(frameTime) {
    const deltaTime = frameTime * MS_CONVERSOR;
    sqrAcc = new Vector(0, gravity);

    while (true) {
        await Sleep(frameTime);
        SetPositions();

        sqrVel = !isPushing ? sqrVel.Add(sqrAcc.Mult(deltaTime)) : PushSquare();
        sqrVel = sqrVel.Add(SpringPush().Mult(deltaTime));

        const nextFramePos = sqrPos.Add(sqrVel.Mult(deltaTime));
        DetectCollision(nextFramePos, deltaTime);
        
        sqrPos = sqrPos.Add(sqrVel.Mult(deltaTime));
        MoveSquare(sqrPos, FRAME_TIME);
    }
}

function Start() {
    sqrPos = startPosition;
    
    SetPositions();
    MoveSquare(sqrPos, 0);
}

async function Play() {
    Start();

    await Sleep(FRAME_TIME);
    Process(FRAME_TIME);
}

// execution

Play();
