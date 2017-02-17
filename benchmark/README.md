## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Libraries
- Aigle v0.2.0
- Bluebird v3.4.7

### Results
|benchmark|aigle|bluebird|
|---|---|---|
|all|**31.7μs**|44.8μs [0.707]|
|join|**1.58μs**|2.46μs [0.643]|
|map|**40.4μs**|54.0μs [0.748]|
|promise:then|**178μs**|339μs [0.525]|
|promisify|**2.06μs**|27.7μs [0.0743]|
|promisifyAll|**28.8μs**|121μs [0.239]|
|props|**59.6μs**|69.2μs [0.862]|
|race|**34.1μs**|42.3μs [0.807]|
|using|**2.86μs**|9.59μs [0.298]|
