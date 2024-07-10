import Vector from "./vector.js";

export default class Holder {
    constructor(hPos, dragV, detRad) {
        this.hPos = hPos;
        this.dragV = dragV;
        this.detRad = detRad;
    }

    Hold(element) {
        const mPos = new Vector(element.clientX, element.clientY);
        const dVec = mPos.Subtract(this.hPos);

        if (dVec.MagSqrd() >= Math.pow(this.detRad, 2)) return new Vector();
        return dVec.Mult(this.dragV);
    }
}