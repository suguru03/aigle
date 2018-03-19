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

class Crow extends Error {
    crow(): string {
        return 'crow';
    }
}

type List<T> = ArrayLike<T>;

/* variables */

let obj: object;
let bool: boolean;
let num: number;
let str: string;
let err: Error;

let hawk: Hawk;
let swan: Swan;
let duck: Duck;

let hawkArr: Hawk[];
let swanArr: Swan[];
let duckArr: Duck[];

let hawkList: List<Hawk>;
let swanList: List<Swan>;
let duckList: List<Duck>;

let hawkProm: Aigle<Hawk>;
let swanProm: Aigle<Swan>;
let duckProm: Aigle<Duck>;

let hawkThen: PromiseLike<Hawk>;
let swanThen: PromiseLike<Swan>;
let duckThen: PromiseLike<Duck>;

/* core functions */

//-- instances --//

hawkProm = new Aigle((resolve: (value: Hawk) => void, reject: (reason: any) => void) => bool ? resolve(hawk) : reject(err));

hawkProm = new Aigle((resolve: (value: Hawk) => void) => resolve(hawk));

hawkProm = new Aigle<Hawk>((resolve, reject) => bool ? resolve(hawkThen) : reject(err));

hawkProm = new Aigle<Hawk>((resolve) => resolve(hawkThen));

//-- then --//

hawkProm.then((value: Hawk) => swan, (reason: any) => err);

hawkProm.then((value: Hawk) => swanProm, (reason: any) => duckProm);

hawkProm.then((value: Hawk) => swan)
  .then((value: Swan) => duck);

hawkProm.then((value: Hawk) => swanProm)
  .then((value: Swan) => duck);

hawkProm.then((value: Hawk) => swanProm)
  .then((value: Swan) => duckProm)
  .then((value: Duck) => null);

//-- catch --//

hawkProm.catch((reason: any) => {});
hawkProm.catch((error: any) => true, (reason: any) => {});
hawkProm.catch(Crow, (reason: any) => {});
hawkProm.catch(Crow, Crow, Crow, (reason: any) => {});

//-- finally --//

hawkProm.finally(() => {});
hawkProm.finally(() => str);
hawkProm.finally(() => swanProm);

//-- resolve --//

Aigle.resolve(hawk)
  .then((value: Hawk) => swan);

Aigle.resolve(hawkProm)
  .then((value: Hawk) => swan);

//-- reject --//

Aigle.reject(err)
  .catch((error: any) => {});

Aigle.resolve(hawkProm)
  .catch((error: any) => Aigle.reject(error))
  .then((value: Hawk) => swan);

/* each */

//-- each:array --//

Aigle.each(hawkArr, (hawk: Hawk, index: number, arr: Hawk[]) => hawk)
  .then((arr: Hawk[]) => {});

Aigle.each(hawkArr, (hawk: Hawk, index: number) => swan)
  .then((arr: Hawk[]) => {});

Aigle.each(hawkArr, (hawk: Hawk) => duck)
  .then((arr: Hawk[]) => {});

//-- each:list --//

Aigle.each(hawkList, (hawk: Hawk, index: number, arr: List<Hawk>) => hawk)
  .then((list: List<Hawk>) => {});

Aigle.each(hawkList, (hawk: Hawk, index: number) => swan)
  .then((list: List<Hawk>) => {});

Aigle.each(hawkList, (hawk: Hawk) => duck)
  .then((list: List<Hawk>) => {});

//-- each:object --//

Aigle.each(hawk, (val: Hawk[keyof Hawk], key: string, hawk: Hawk) => hawk)
  .then((hawk: Hawk) => {});

Aigle.each(hawk, (val: Hawk[keyof Hawk], key: string) => swan)
  .then((hawk: Hawk) => {});

Aigle.each(hawk, (val: Hawk[keyof Hawk]) => duck)
  .then((hawk: Hawk) => {});
