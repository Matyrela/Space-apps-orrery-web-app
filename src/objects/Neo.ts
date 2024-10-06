export interface NEO {
    name: string;
    neo: boolean;
    pha: boolean;
    diameter: number;
    gm: number;
    e: number;
    a: number;
    q: number;
    i: number;
    om: number;
    w: number;
    ma: number;
    ad: number;
    tp: number;
}

export class NearEarthObject implements NEO {

    private name: string;
    private neo: boolean;
    private pha: boolean;
    private diameter: number;
    private gm : number;
    private e: number;
    private a: number;
    private q: number;
    private i: number;
    private om: number;
    private w: number;
    private ma: number;
    private ad: number;
    private tp: number;

    constructor(
        public neo: NEO
    ) {
        this.name = neo.name;
        this.neo = neo.neo;
        this.pha = neo.pha;
        this.diameter = neo.diameter;
        this.gm = neo.gm;
        this.e = neo.e;
        this.a = neo.a;
        this.q = neo.q;
        this.i = neo.i;
        this.om = neo.om;
        this.w = neo.w;
        this.ma = neo.ma;
        this.ad = neo.ad;
        this.tp = neo.tp;
    }
}
