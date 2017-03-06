## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Libraries
- Aigle v0.4.5
- Bluebird v3.5.0

### Results
|benchmark|aigle|bluebird|
|---|---|---|
|all|**30.9μs**|41.0μs [0.753]|
|join|**1.52μs**|2.56μs [0.593]|
|map|**36.3μs**|60.3μs [0.602]|
|promise:then|**174μs**|349μs [0.499]|
|promisify|**2.10μs**|27.7μs [0.0756]|
|promisifyAll|**23.3μs**|120μs [0.194]|
|props|**57.4μs**|71.0μs [0.808]|
|race|**30.4μs**|46.6μs [0.653]|
|using|**2.76μs**|9.46μs [0.291]|
