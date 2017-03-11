## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Libraries
- Aigle v0.5.0
- Bluebird v3.5.0

### Results
|benchmark|aigle|bluebird|
|---|---|---|
|all|**30.7μs**|40.8μs [0.751]|
|join|**1.47μs**|2.55μs [0.576]|
|map|**35.0μs**|54.8μs [0.639]|
|promise:then|**174μs**|336μs [0.518]|
|promisify|**1.98μs**|27.6μs [0.0716]|
|promisifyAll|**22.5μs**|116μs [0.194]|
|props|**58.3μs**|69.0μs [0.844]|
|race|**30.1μs**|43.9μs [0.686]|
|using|**2.48μs**|9.65μs [0.256]|
