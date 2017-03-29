## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Libraries
- Aigle v0.6.0
- Bluebird v3.5.0

### Results
|benchmark|aigle|bluebird|
|---|---|---|
|all|**33.0μs**|45.0μs [0.734]|
|join|**24.6μs**|31.2μs [0.789]|
|map|**37.4μs**|57.0μs [0.656]|
|promise:then|**189μs**|359μs [0.528]|
|promisify|**2.11μs**|28.4μs [0.0743]|
|promisifyAll|**24.8μs**|131μs [0.189]|
|props|**63.4μs**|77.3μs [0.820]|
|race|**34.9μs**|44.8μs [0.779]|
|using|**2.65μs**|9.66μs [0.274]|
