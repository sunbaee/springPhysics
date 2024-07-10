import Vector from './JavaScript/vector.js';
import Holder from './JavaScript/holder.js';

// HTML config
document.addEventListener("dragstart", e => {
    e.preventDefault();
});

function DisableContainer(element) {
    const contVars = document.querySelector(".container");
    
    contVars.animate({
        transform: `translateX(${element.checked ? 0 : -100}%)`,
        opacity: `${element.checked ? 1 : 0}`,
        filter: `blur(${element.checked ? 0 : 3}rem)`
    }, {
        duration: 800,
        fill: "forwards",
        easing: "ease-in-out"
    })
}

// = > Resolution transition
const dWidth = 1880;
const dHeight = 940;

var resParse = new Vector(dWidth / window.innerWidth, dHeight / window.innerHeight);

const pixelM = 150;

class Custom {
    constructor(id, v) {
        this.id = id;
        this.v = v;
    }
}

// => Time config
const MS_CONVERSOR = 0.001; // converts ms to seconds

var cfgArr = [new Custom('FPS', Math.round(1 / 60 * 1000)), 
              new Custom('Mass', 5), 
              new Custom('Gravity', pixelM * 10 * resParse.y), 
              new Custom('collisionDamping', .4), 
              new Custom('staticFric', .65 * pixelM * 10 * resParse.y), 
              new Custom('cineticFric', .25 * pixelM * 10 * resParse.y),  
              new Custom('springSize', pixelM * resParse.y), 
              new Custom('eConst', 50)]

function UpdateLabelValues(element, type) {
    cfgArr.forEach(e => {
        if (e.id == element.id) switch(type) {
            case 'FrPerS': e.v = Math.round(1 / element.value * 1000); break;
            case "%F": e.v = element.value / 100 * cfgArr[2].v;  break;
            case "m": e.v = element.value * pixelM * resParse.y;  break;
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
const startPosition = new Vector(innerWidth / 2.5, innerHeight * 1 / 4);

var sqrHalfSize = Math.round(window.innerHeight / 100 * 3);
var sqrPushRadius = sqrHalfSize * 2;

// Object variables
var sqrVel = new Vector(),
    sqrPos = new Vector(),
    mPos = new Vector();

var animInterp = true,
    hasGround = true,
    isPaused = false;

var isClicking,
    isPushing;

var springPos,
    groundY;

// PX related
var velPerDist = 8 * resParse.y; 

// Errors
var V_ERROR = new Vector(10 * resParse.x, 30 * resParse.y);

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

    if (isPaused) sqrVel = new Vector();
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

function SpringDistance(springVector) {
    return (springVector.Mag() - cfgArr[6].v);
}

function SpringPush() {
    const kConst = cfgArr[7].v,
          mass = cfgArr[1].v;

    const springVec = sqrPos.Subtract(springPos);
    const springAcc = -(kConst * (SpringDistance(springVec))) / mass;

    return springVec.Normalized().Mult(springAcc);
}

const energy = document.querySelector(".simInfo p var");

function UpdateEnergy() {
    const gAcc = cfgArr[2].v,
          mass = cfgArr[1].v,
          kCns = cfgArr[7].v;

    const gEnergy = mass * (gAcc / pixelM) * (groundY - (sqrPos.y + sqrHalfSize)) / pixelM,
          kEnergy = (kCns * Math.pow(SpringDistance(sqrPos.Subtract(springPos)) / pixelM, 2)) / 2,
          cEnergy = (mass * Math.pow(sqrVel.Mag() / pixelM, 2)) / 2;
    
    energy.innerText = (gEnergy + kEnergy + cEnergy).toFixed(4);
}

function DetectCollision(nextPos, deltaTime, acc) {
    if (nextPos.y + sqrHalfSize >= groundY && hasGround) {
        sqrPos.y = groundY - sqrHalfSize;
        
        var sFric = cfgArr[4].v,
            cFric = cfgArr[5].v,
            fType;

        fType = (Math.abs(acc.x) <= sFric && sqrVel.x < V_ERROR.x) ? acc.x : cFric;

        sqrVel.x += -Math.sign(sqrVel.x) * fType * deltaTime;
        sqrVel.y = (-Math.abs(sqrVel.y) + acc.y / 2 * deltaTime) * cfgArr[3].v;
        
        if (Math.abs(sqrVel.y) <= V_ERROR.y) sqrVel.y = 0;
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
        else sqrAcc = !isPaused ? sqrAcc.Add(SpringPush()) : new Vector();

        sqrVel = sqrVel.Add(sqrAcc.Mult(deltaTime));
        
        const nextFramePos = sqrPos.Add(sqrVel.Mult(deltaTime));
        DetectCollision(nextFramePos, deltaTime, sqrAcc);

        //const k1 = sqrPos.Add(sqrVel.Mult(deltaTime)), // Eulers Method
        //      k2 = sqrPos.Add(sqrVel.Mult(deltaTime / 2).Add(k1.Mult(deltaTime / 2)).Mult(1/2));

        sqrPos = sqrPos.Add(sqrVel.Mult(deltaTime));
        
        UpdateEnergy();
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

// window functions

window.Pause = Pause;
window.EnableInterpolation = EnableInterpolation;
window.DisableGround = DisableGround;
window.UpdateLabelValues = UpdateLabelValues;
window.DisableContainer = DisableContainer;
