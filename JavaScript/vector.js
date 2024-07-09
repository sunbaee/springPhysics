export default class Vector{
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

