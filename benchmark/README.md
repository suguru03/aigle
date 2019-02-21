## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Environment
- Node v11.10.0

### Libraries
- Aigle v1.13.0
- Bluebird v3.5.3
- native v11.10.0

### Results
|benchmark|aigle|bluebird|native|
|---|---|---|---|
|all|**22.2μs**|28.9μs [0.766]|31.8μs [0.697]|
|join|**5.52μs**|10.7μs [0.518]||
|map|**21.4μs**|36.5μs [0.587]||
|mapSeries|**195μs**|442μs [0.442]||
|mapSeries:class|**194μs**|437μs [0.444]||
|promise:then|**201μs**|437μs [0.461]|218μs [0.921]|
|promisify|**2.35μs**|19.7μs [0.119]|8.57μs [0.274]|
|promisify:promisified|**2.23μs**|2.64μs [0.844]|2.54μs [0.877]|
|promisifyAll|**12.4μs**|62.8μs [0.197]||
|props|**32.0μs**|42.5μs [0.753]||
|race|**22.3μs**|32.5μs [0.684]||
|using|**2.69μs**|7.51μs [0.358]||
