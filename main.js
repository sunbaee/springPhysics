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

    Mult(v) {
        return new Vector(this.x * v, this.y * v);
    }

    Normalized() {
        if (this.x == 0 && this.y == 0) return new Vector();

        const vec = new Vector(this.x, this.y);
        return new Vector(this.x / vec.Mag(), this.y / vec.Mag());
    }
}

// HTML config

document.addEventListener("dragstart", e => {
    e.preventDefault();
});

// Custom variables

// = > Resolution transition
const dWidth = 1880;
const dHeight = 940;

var resParse = new Vector(dWidth / window.innerWidth, dHeight / window.innerHeight);

class Custom {
    constructor(id, v) {
        this.id = id;
        this.v = v;
    }
}

// => Time config
const MS_CONVERSOR = 0.001; // converts ms to seconds

// => Booleans
var hasGround = true;
var isPaused = false;

var cfgArr = [new Custom('FPS', Math.round(1 / 60 * 1000)), 
              new Custom('Mass', 5), 
              new Custom('Gravity', 1650 * resParse.y), 
              new Custom('collisionDamping', .4), 
              new Custom('staticFric', .65 * 1650 * resParse.y), 
              new Custom('cineticFric', .25 * 1650 * resParse.y),  
              new Custom('springSize', 165 * resParse.y), 
              new Custom('eConst', 50), 
              new Custom('hasGround', true), 
              new Custom('isPaused', false)];

function UpdateLabelValues(element, type) {
    cfgArr.forEach(e => {
        if (e.id == element.id) switch(type) {
            case 'FrPerS': e.v = Math.round(1 / element.value * 1000); break;
            case "%F": e.v = element.value / 100 * cfgArr[2].v;  break;
            case "m": e.v = element.value * 165 * resParse.y;  break;
            case "%": e.v = element.value / 100;  break;

            default: e.v = element.value;
        }
    });

    const eSpan = document.querySelector("label[for=" + element.id + "] span");
    if (eSpan) eSpan.innerText = element.value;
}

// Physics

const Sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const square = document.querySelector("#square");
const ground = document.querySelector(".ground");
const spring = document.querySelector(".spring");

// Object config
const startPosition = new Vector(innerWidth / 2, innerHeight * 1 / 4);

var sqrHalfSize = Math.round(window.innerHeight / 100 * 3);
var sqrPushRadius = sqrHalfSize * 2;

// Object variables
var sqrVel = new Vector(),
    sqrPos = new Vector(),
    mPos = new Vector();

var animInterp = true,
    isClicking,
    isPushing,
    isPaused;

var springPos,
    groundY;

// PX related
var velPerDist = 8 * resParse.y; //0.07; 

// Errors
var V_ERROR = new Vector(.5 * resParse.x, 100 * resParse.y);

function DetectMousePush(e) {
    mPos = new Vector(e.clientX, e.clientY);
    
    const distVec = mPos.Subtract(sqrPos);
    if (distVec.MagSqrd() <= Math.pow(sqrPushRadius, 2)) isPushing = true;
}

window.onmousedown = e => {
    DetectMousePush(e);

    isClicking = true;
}

window.onmousemove = e => {
    if (!isClicking) return;

    DetectMousePush(e);
}

window.onmouseup = () => {
    if (!isPushing && !isClicking) return;

    isClicking = false;
    isPushing = false;
}

function Pause(element) {
    isPaused = element.checked;

    sqrVel = new Vector();
}

function EnableInterpolation(element) {
    animInterp = element.checked;
}

function DisableGround(element) {
    hasGround = element.checked;
    
    ground.style.opacity = hasGround ? 1 : 0;
}

function SetPositions() {
    springPos = new Vector(spring.getBoundingClientRect().x, spring.getBoundingClientRect().y);

    sqrHalfSize = Math.round(window.innerHeight / 100 * 3);
    sqrPushRadius = sqrHalfSize * 2;

    groundY = ground.getBoundingClientRect().bottom;

    resParse = new Vector(window.innerWidth / dWidth, window.innerHeight / dHeight);
}

function PushSquare() {
    if (!isPushing) return;

    return mPos.Subtract(sqrPos).Mult(velPerDist);
}

function SpringPush() {
    const dSpringSize = cfgArr[6].v;
    const kConst = cfgArr[7].v;
    const mass = cfgArr[1].v;

    const springVec = sqrPos.Subtract(springPos);
    const springAcc = -(kConst * (springVec.Mag() - dSpringSize)) / mass;

    return springVec.Normalized().Mult(springAcc);
}

function DetectCollision(nextPos, deltaTime, acc) {
    if (nextPos.y + sqrHalfSize >= groundY && hasGround) {
        sqrPos.y = groundY - sqrHalfSize;
        
        var sFric = cfgArr[4].v,
            cFric = cfgArr[5].v,
            fType;

        fType = (Math.abs(acc.x) <= sFric && sqrVel.x < V_ERROR.x) ? acc.x : cFric;

        sqrVel.x += -Math.sign(sqrVel.x) * fType * deltaTime;
        sqrVel.y = -Math.abs(sqrVel.y) * cfgArr[3].v;
        
        if (Math.abs(sqrVel.y) - cfgArr[2].v * deltaTime <= V_ERROR.y) sqrVel.y = 0;
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
    while (true) {
        const deltaTime = cfgArr[0].v * MS_CONVERSOR;
        var sqrAcc = !isPaused ? new Vector(0, cfgArr[2].v) : new Vector();
        
        await Sleep(cfgArr[0].v);
        SetPositions();

        if (isPushing) sqrVel = PushSquare();
        else sqrAcc = !isPaused ? sqrAcc.Add(SpringPush()) : sqrAcc;

        const nextFramePos = sqrPos.Add(sqrVel.Mult(deltaTime));
        DetectCollision(nextFramePos, deltaTime, sqrAcc);
        
        sqrVel = sqrVel.Add(sqrAcc.Mult(deltaTime));
        sqrPos = sqrPos.Add(sqrVel.Mult(deltaTime));
        
        MoveSquare(sqrPos, animInterp ? cfgArr[0].v : frameTime);
    }
}

function Start() {
    sqrPos = startPosition;
    
    SetPositions();
    MoveSquare(sqrPos, 0);
}

async function Play() {
    Start();

    await Sleep(cfgArr[0].v);
    Process(cfgArr[0].v);
}

// execution

Play();
