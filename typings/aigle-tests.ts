import Aigle from './aigle';

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

type Hawks = Hawk[];
type Swans = Swan[];
type Ducks = Duck[];
type Crows = Crow[];

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

let hawkArr: Hawks;
let swanArr: Swans;
let duckArr: Ducks;

let hawkList: List<Hawk>;
let swanList: List<Swan>;
let duckList: List<Duck>;

let hawkProm: Aigle<Hawk>;
let swanProm: Aigle<Swan>;
let duckProm: Aigle<Duck>;

let hawkThen: PromiseLike<Hawk>;
let swanThen: PromiseLike<Swan>;
let duckThen: PromiseLike<Duck>;

let hawkArrProm: Aigle<Hawks>;
let swanArrProm: Aigle<Swans>;
let duckArrProm: Aigle<Ducks>;

let hawkListProm: Aigle<List<Hawk>>;
let swanListProm: Aigle<List<Swan>>;
let duckListProm: Aigle<List<Duck>>;

/* core functions */

//-- instances --//

hawkProm = new Aigle(
  (resolve: (value: Hawk) => void, reject: (reason: any) => void) => (bool ? resolve(hawk) : reject(err))
);

hawkProm = new Aigle((resolve: (value: Hawk) => void) => resolve(hawk));

hawkProm = new Aigle<Hawk>((resolve, reject) => (bool ? resolve(hawkThen) : reject(err)));

hawkProm = new Aigle<Hawk>(resolve => resolve(hawkThen));

//-- then --//

hawkProm.then((value: Hawk) => swan, (reason: any) => err);

hawkProm.then((value: Hawk) => swanProm, (reason: any) => duckProm);

hawkProm.then((value: Hawk) => swan).then((value: Swan) => duck);

hawkProm.then((value: Hawk) => swanProm).then((value: Swan) => duck);

hawkProm
  .then((value: Hawk) => swanProm)
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

/* each/forEach */

//-- each:array --//

hawkArrProm.each((hawk: Hawk, index: number, arr: Hawks) => hawk).then((arr: Hawks) => {});

hawkArrProm.each((hawk: Hawk, index: number) => swan).then((arr: Hawks) => {});

hawkArrProm.each((hawk: Hawk) => duck).then((arr: Hawks) => {});

//-- each:list --//

hawkListProm.each((hawk: Hawk, index: number, list: List<Hawk>) => hawk).then((list: List<Hawk>) => {});

hawkListProm.each((hawk: Hawk, index: number) => swan).then((list: List<Hawk>) => {});

hawkListProm.each((hawk: Hawk) => duck).then((list: List<Hawk>) => {});

//-- each:object --//

hawkProm.each((val: Hawk[keyof Hawk], key: string, hawk: Hawk) => hawk).then((hawk: Hawk) => {});

hawkProm.each((val: Hawk[keyof Hawk], key: string) => swan).then((hawk: Hawk) => {});

hawkProm.each((val: Hawk[keyof Hawk]) => duck).then((hawk: Hawk) => {});

//-- forEach:array --//

hawkArrProm.forEach((hawk: Hawk, index: number, arr: Hawks) => hawk).then((arr: Hawks) => {});

hawkArrProm.forEach((hawk: Hawk, index: number) => swan).then((arr: Hawks) => {});

hawkArrProm.forEach((hawk: Hawk) => duck).then((arr: Hawks) => {});

//-- forEach:list --//

hawkListProm.forEach((hawk: Hawk, index: number, list: List<Hawk>) => hawk).then((list: List<Hawk>) => {});

hawkListProm.forEach((hawk: Hawk, index: number) => swan).then((list: List<Hawk>) => {});

hawkListProm.forEach((hawk: Hawk) => duck).then((list: List<Hawk>) => {});

//-- forEach:object --//

hawkProm.forEach((val: Hawk[keyof Hawk], key: string, hawk: Hawk) => hawk).then((hawk: Hawk) => {});

hawkProm.forEach((val: Hawk[keyof Hawk], key: string) => swan).then((hawk: Hawk) => {});

hawkProm.forEach((val: Hawk[keyof Hawk]) => duck).then((hawk: Hawk) => {});

/* eachSeries/forEachSeries */

//-- eachSeries:array --//

hawkArrProm.eachSeries((hawk: Hawk, index: number, arr: Hawks) => hawk).then((arr: Hawks) => {});

hawkArrProm.eachSeries((hawk: Hawk, index: number) => swan).then((arr: Hawks) => {});

hawkArrProm.eachSeries((hawk: Hawk) => duck).then((arr: Hawks) => {});

//-- eachSeries:list --//

hawkListProm.eachSeries((hawk: Hawk, index: number, list: List<Hawk>) => hawk).then((list: List<Hawk>) => {});

hawkListProm.eachSeries((hawk: Hawk, index: number) => swan).then((list: List<Hawk>) => {});

hawkListProm.eachSeries((hawk: Hawk) => duck).then((list: List<Hawk>) => {});

//-- eachSeries:object --//

hawkProm.eachSeries((val: Hawk[keyof Hawk], key: string, hawk: Hawk) => hawk).then((hawk: Hawk) => {});

hawkProm.eachSeries((val: Hawk[keyof Hawk], key: string) => swan).then((hawk: Hawk) => {});

hawkProm.eachSeries((val: Hawk[keyof Hawk]) => duck).then((hawk: Hawk) => {});

//-- forEachSeries:array --//

hawkArrProm.forEachSeries((hawk: Hawk, index: number, arr: Hawks) => hawk).then((arr: Hawks) => {});

hawkArrProm.forEachSeries((hawk: Hawk, index: number) => swan).then((arr: Hawks) => {});

hawkArrProm.forEachSeries((hawk: Hawk) => duck).then((arr: Hawks) => {});

//-- forEachSeries:list --//

hawkListProm.forEachSeries((hawk: Hawk, index: number, list: List<Hawk>) => hawk).then((list: List<Hawk>) => {});

hawkListProm.forEachSeries((hawk: Hawk, index: number) => swan).then((list: List<Hawk>) => {});

hawkListProm.forEachSeries((hawk: Hawk) => duck).then((list: List<Hawk>) => {});

//-- forEachSeries:object --//

hawkProm.forEachSeries((val: Hawk[keyof Hawk], key: string, hawk: Hawk) => hawk).then((hawk: Hawk) => {});

hawkProm.forEachSeries((val: Hawk[keyof Hawk], key: string) => swan).then((hawk: Hawk) => {});

hawkProm.forEachSeries((val: Hawk[keyof Hawk]) => duck).then((hawk: Hawk) => {});

/* concat */

//-- concat:array --//

hawkArrProm.concat((hawk: Hawk, index: number, arr: Hawks) => [hawk]).then((arr: Hawks) => {});

hawkArrProm.concat((hawk: Hawk, index: number) => [swan]).then((arr: Swans) => {});

hawkArrProm.concat((hawk: Hawk) => duck).then((arr: Ducks) => {});

//-- concat:list --//

hawkListProm.concat((hawk: Hawk, index: number, list: List<Hawk>) => [hawk]).then((arr: Hawks) => {});

hawkListProm.concat((hawk: Hawk, index: number) => [swan]).then((arr: Swans) => {});

hawkListProm.concat((hawk: Hawk) => duck).then((arr: Ducks) => {});

//-- concat:object --//

hawkProm.concat((val: Hawk[keyof Hawk], key: string, hawk: Hawk) => [hawk]).then((arr: Hawks) => {});

hawkProm.concat((val: Hawk[keyof Hawk], key: string) => [swan]).then((arr: Swans) => {});

hawkProm.concat((val: Hawk[keyof Hawk]) => duck).then((arr: Ducks) => {});

/** static **/

/* core functions */

//-- resolve --//

Aigle.resolve(hawk).then((value: Hawk) => swan);

Aigle.resolve(hawkProm).then((value: Hawk) => swan);

//-- reject --//

Aigle.reject(err).catch((error: any) => {});

Aigle.resolve(hawkProm)
  .catch((error: any) => Aigle.reject(error))
  .then((value: Hawk) => swan);

/* each/forEach */

//-- each:array --//

Aigle.each(hawkArr, (hawk: Hawk, index: number, arr: Hawks) => hawk).then((arr: Hawks) => {});

Aigle.each(hawkArr, (hawk: Hawk, index: number) => swan).then((arr: Hawks) => {});

Aigle.each(hawkArr, (hawk: Hawk) => duck).then((arr: Hawks) => {});

//-- each:list --//

Aigle.each(hawkList, (hawk: Hawk, index: number, arr: List<Hawk>) => hawk).then((list: List<Hawk>) => {});

Aigle.each(hawkList, (hawk: Hawk, index: number) => swan).then((list: List<Hawk>) => {});

Aigle.each(hawkList, (hawk: Hawk) => duck).then((list: List<Hawk>) => {});

//-- each:object --//

Aigle.each(hawk, (val: Hawk[keyof Hawk], key: string, hawk: Hawk) => hawk).then((hawk: Hawk) => {});

Aigle.each(hawk, (val: Hawk[keyof Hawk], key: string) => swan).then((hawk: Hawk) => {});

Aigle.each(hawk, (val: Hawk[keyof Hawk]) => duck).then((hawk: Hawk) => {});

//-- forEach:array --//

Aigle.forEach(hawkArr, (hawk: Hawk, index: number, arr: Hawks) => hawk).then((arr: Hawks) => {});

Aigle.forEach(hawkArr, (hawk: Hawk, index: number) => swan).then((arr: Hawks) => {});

Aigle.forEach(hawkArr, (hawk: Hawk) => duck).then((arr: Hawks) => {});

//-- forEach:list --//

Aigle.forEach(hawkList, (hawk: Hawk, index: number, arr: List<Hawk>) => hawk).then((list: List<Hawk>) => {});

Aigle.forEach(hawkList, (hawk: Hawk, index: number) => swan).then((list: List<Hawk>) => {});

Aigle.forEach(hawkList, (hawk: Hawk) => duck).then((list: List<Hawk>) => {});

//-- forEach:object --//

Aigle.forEach(hawk, (val: Hawk[keyof Hawk], key: string, hawk: Hawk) => hawk).then((hawk: Hawk) => {});

Aigle.forEach(hawk, (val: Hawk[keyof Hawk], key: string) => swan).then((hawk: Hawk) => {});

Aigle.forEach(hawk, (val: Hawk[keyof Hawk]) => duck).then((hawk: Hawk) => {});

/* concat */

//-- concat:array --//

Aigle.concat(hawkArr, (hawk: Hawk, index: number, arr: Hawks) => [hawk]).then((arr: Hawks) => {});

Aigle.concat(hawkArr, (hawk: Hawk, index: number) => [swan]).then((arr: Swans) => {});

Aigle.concat(hawkArr, (hawk: Hawk) => duck).then((arr: Ducks) => {});

//-- concat:list --//

Aigle.concat(hawkList, (hawk: Hawk, index: number, arr: List<Hawk>) => [hawk]).then((arr: Hawks) => {});

Aigle.concat(hawkList, (hawk: Hawk, index: number) => [swan]).then((arr: Swans) => {});

Aigle.concat(hawkList, (hawk: Hawk) => duck).then((arr: Ducks) => {});

//-- concat:object --//

Aigle.concat(hawk, (val: Hawk[keyof Hawk], key: string, hawk: Hawk) => [hawk]).then((arr: Hawks) => {});

Aigle.concat(hawk, (val: Hawk[keyof Hawk], key: string) => [swan]).then((arr: Swans) => {});

Aigle.concat(hawk, (val: Hawk[keyof Hawk]) => duck).then((arr: Ducks) => {});
