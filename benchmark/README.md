## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Libraries
- Aigle v1.1.0
- Bluebird v3.5.0

### Results
|benchmark|aigle|bluebird|
|---|---|---|
|all|**34.9μs**|45.6μs [0.764]|
|join|**23.3μs**|30.5μs [0.762]|
|map|**35.1μs**|54.9μs [0.639]|
|promise:then|**175μs**|365μs [0.480]|
|promisify|**2.04μs**|29.7μs [0.0686]|
|promisifyAll|**24.8μs**|122μs [0.203]|
|props|**60.3μs**|79.1μs [0.762]|
|race|**34.2μs**|46.0μs [0.744]|
|using|**2.47μs**|9.45μs [0.261]|
