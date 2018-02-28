/* interface */

interface Hawk {
    hawk(): string;
}

interface Swan {
    swan(): string;
}

interface Duck {
    duck(): string;
}

/* variables */

let obj: object;
let bool: boolean;
let num: number;
let str: string;
let err: Error;

let hawk: Hawk;
let swan: Swan;
let duck: Duck;

let hawkProm: Aigle<Hawk>;
let swanProm: Aigle<Swan>;
let duckProm: Aigle<Duck>;

let hawkThen: PromiseLike<Hawk>;
let swanThen: PromiseLike<Swan>;
let duckThen: PromiseLike<Duck>;

/* core functions */

hawkProm = new Aigle((resolve: (value: Hawk) => void, reject: (reason: any) => void) => bool ? resolve(hawk) : reject(err));

hawkProm = new Aigle((resolve: (value: Hawk) => void) => resolve(hawk));

hawkProm = new Aigle<Hawk>((resolve, reject) => bool ? resolve(hawkThen) : reject(err));

hawkProm = new Aigle<Hawk>((resolve) => resolve(hawkThen));
