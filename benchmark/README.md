## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Environment
- Node v8.0.0

### Libraries
- Aigle v1.4.2
- Bluebird v3.5.0

### Results
|benchmark|aigle|bluebird|
|---|---|---|
|all|**52.4μs**|78.9μs [0.663]|
|join|**9.58μs**|17.2μs [0.558]|
|map|**55.2μs**|98.3μs [0.562]|
|mapSeries|**169μs**|395μs [0.427]|
|mapSeries:class|**171μs**|387μs [0.441]|
|promise:then|**180μs**|364μs [0.496]|
|promisify|**2.06μs**|26.9μs [0.0768]|
|promisifyAll|**16.7μs**|96.1μs [0.173]|
|props|**64.9μs**|93.2μs [0.696]|
|race|**52.0μs**|77.0μs [0.675]|
|using|**2.82μs**|10.1μs [0.281]|
