## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Libraries
- Aigle v0.4.0
- Bluebird v3.4.7

### Results
|benchmark|aigle|bluebird|
|---|---|---|
|all|**31.3μs**|42.3μs [0.741]|
|join|**1.62μs**|2.59μs [0.626]|
|map|**35.2μs**|57.5μs [0.613]|
|promise:then|**178μs**|348μs [0.511]|
|promisify|**2.06μs**|28.0μs [0.0737]|
|promisifyAll|**28.8μs**|118μs [0.245]|
|props|**56.8μs**|69.1μs [0.821]|
|race|**30.4μs**|42.8μs [0.712]|
|using|**2.67μs**|9.60μs [0.278]|
