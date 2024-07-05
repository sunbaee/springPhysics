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
const container = document.querySelector(".container");

const startPosition = new Vector(innerWidth / 2, innerHeight * 1 / 4);
const sqrPushRadius = Math.round(window.innerHeight / 100 * 6);
const sqrHalfSize = Math.round(window.innerHeight / 100 * 3);

const collisionDamping = 1; 
const collisionFriction = 0.2;

const gravity = 980; // value per frame ("cm")

const velPerDist = 8;

const VELOCITY_ERROR = 10;
const MS_CONVERSOR = 0.001; // converts ms to seconds
const FRAME_TIME = 16; // ms

var sqrAcc = new Vector();
var sqrVel = new Vector();
var sqrPos = new Vector();

var mPos = new Vector();

var gPotVel;
var groundY;
var isPushing;

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
    SetGPotential();
}

function SetPositions() {
    groundY = container.getBoundingClientRect().bottom;
}

function SetGPotential() {
    var groundHeight = Math.max(0, groundY - sqrPos.y);
    var velSqrd = 2 * gravity * (groundHeight - sqrHalfSize) + Math.pow(sqrVel.y, 2);
    
    gPotVel = Math.sqrt(Math.max(0, velSqrd * collisionDamping));
}

function PushSquare() {
    if (!isPushing) return;

    return mPos.Subtract(sqrPos).Mult(velPerDist);
}

function DetectCollision() {
    if (sqrPos.y + sqrHalfSize >= groundY) {
        sqrVel.x *= (1 - collisionFriction);
        sqrVel.y = -gPotVel;
        
        SetGPotential();
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
        
        sqrVel = !PushSquare() ? sqrVel.Add(sqrAcc.Mult(deltaTime)) : PushSquare();
        DetectCollision();
        
        if (sqrVel.MagSqrd() <= Math.pow(VELOCITY_ERROR, 2)) sqrVel = new Vector();
        
        sqrPos = sqrPos.Add(sqrVel.Mult(deltaTime));
        MoveSquare(sqrPos, FRAME_TIME);
    }
}

function Start() {
    sqrPos = startPosition;
    
    SetPositions();
    SetGPotential();

    MoveSquare(sqrPos, 0);
}

async function Play() {
    Start();

    await Sleep(FRAME_TIME);
    Process(FRAME_TIME);
}

// execution

Play();
