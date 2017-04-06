## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Libraries
- Aigle v1.0.0
- Bluebird v3.5.0

### Results
|benchmark|aigle|bluebird|
|---|---|---|
|all|**31.4μs**|42.3μs [0.741]|
|join|**23.7μs**|31.7μs [0.745]|
|map|**36.0μs**|55.7μs [0.646]|
|promise:then|**178μs**|341μs [0.521]|
|promisify|**1.97μs**|28.2μs [0.0698]|
|promisifyAll|**23.3μs**|119μs [0.195]|
|props|**57.7μs**|72.5μs [0.796]|
|race|**33.8μs**|46.0μs [0.735]|
|using|**2.57μs**|9.28μs [0.277]|
