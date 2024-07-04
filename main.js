// Values

function UpdateLabelValues() {
    const slidersLis = document.querySelectorAll(".sliderLi");

    slidersLis.forEach(element => {
        var sliderValue = element.querySelector(".slider").value;
        var sliderLabel = element.querySelector("label span");
        sliderLabel.innerText = sliderValue;
    });
}

// Physics

const Sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

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

    Subtract(vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

}

const square = document.querySelector("#square");
const container = document.querySelector(".container");

const sqrColRadius = Math.round(window.innerHeight / 100 * 3);

var sqrPos = new Vector();

var groundY;
var isPushing;

window.onmousedown = e => {
    var mPos = new Vector(e.clientX, e.clientY);

    const distVec = mPos.Subtract(sqrPos);
    if (distVec.MagSqrd() <= Math.pow(sqrColRadius, 2)) isPushing = true;
}

window.onmouseup = e => {
    if (!isPushing) return;

    var direction = new Vector(e.clientX, e.clientY).Subtract(sqrPos);
    console.log(direction);
}

function SetPositions() {
    sqrPos.x = square.getBoundingClientRect().x + sqrColRadius;
    sqrPos.y = square.getBoundingClientRect().y + sqrColRadius;

    groundY = window.innerHeight - container.getBoundingClientRect().bottom;
} 

const VELOCITY_ERROR = 10;
const gravity = 980; // value per frame ("cm")
const groundDamping = 0.974; 

const MS_CONVERSOR = 0.001; // converts ms to seconds
const FRAME_TIME = 16; // ms

var deltaPos = 0;
var deltaVel = 0;

const process = async (frameTime) => {
    const deltaTime = frameTime * MS_CONVERSOR;

    while (true) {
        await Sleep(frameTime);
        SetPositions();
        
        deltaVel += gravity * deltaTime;
        
        if (sqrPos.y - deltaVel * deltaTime <= groundY) deltaVel = Math.abs(deltaVel) * -groundDamping;
        if (Math.abs(deltaVel) < VELOCITY_ERROR) deltaVel = 0;
        
        deltaPos += deltaVel * deltaTime;        
        
        square.animate({
            transform: `translateY(${deltaPos}px)`
        }, {
            duration: FRAME_TIME,
            fill: "forwards"
        });
    }
}

const WaitStart = async () => {
    SetPositions();

    await Sleep(10000);
    process(FRAME_TIME);
}

// execution

WaitStart();
