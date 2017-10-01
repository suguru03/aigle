## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Environment
- Node v8.6.0

### Libraries
- Aigle v1.8.1
- Bluebird v3.5.0
- native v8.6.0

### Results
|benchmark|aigle|bluebird|native|
|---|---|---|---|
|all|**42.8μs**|45.6μs [0.937]|66.0μs [0.648]|
|join|**7.93μs**|11.5μs [0.689]||
|map|**41.8μs**|73.4μs [0.570]||
|mapSeries|**132μs**|252μs [0.521]||
|mapSeries:class|**132μs**|254μs [0.521]||
|promise:then|**146μs**|254μs [0.574]|216μs [0.674]|
|promisify|**1.52μs**|21.8μs [0.0698]|15.7μs [0.0972]|
|promisify:promisified|**1.40μs**|1.53μs [0.917]|2.59μs [0.541]|
|promisifyAll|**12.0μs**|77.8μs [0.155]||
|props|**53.3μs**|57.4μs [0.928]||
|race|**43.9μs**|44.0μs [0.998]||
|using|**2.36μs**|7.63μs [0.309]||
