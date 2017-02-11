## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Libraries
- Aigle v0.0.0
- Bluebird v3.4.7

### Results
|benchmark|aigle|bluebird|
|---|---|---|
|all|**32.1μs**|42.8μs [0.750]|
|join|**1.60μs**|2.81μs [0.570]|
|map|**46.8μs**|56.6μs [0.826]|
|promise:then|**212μs**|342μs [0.618]|
|promisify|**2.34μs**|28.3μs [0.0829]|
|promisifyAll|**33.0μs**|121μs [0.272]|
|props|**71.4μs**|76.7μs [0.931]|
|race|**45.2μs**|47.3μs [0.956]|
