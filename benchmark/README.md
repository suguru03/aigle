## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Environment
- Node v8.0.0

### Libraries
- Aigle v1.4.2
- Bluebird v3.5.0
- native v8.0.0

### Results
|benchmark|aigle|bluebird|native|
|---|---|---|---|
|all|**58.0μs**|84.0μs [0.690]|83.4μs [0.695]|
|join|**10.6μs**|19.4μs [0.545]||
|map|**59.9μs**|108μs [0.555]||
|mapSeries|**182μs**|412μs [0.443]||
|mapSeries:class|**177μs**|407μs [0.436]||
|promise:then|**189μs**|390μs [0.483]|271μs [0.696]|
|promisify|**2.16μs**|29.4μs [0.0736]|12.4μs [0.175]|
|promisify:promisified|**2.28μs**|2.54μs [0.898]|3.77μs [0.604]|
|promisifyAll|**18.4μs**|110μs [0.167]||
|props|**71.9μs**|106μs [0.677]||
|race|**60.5μs**|84.0μs [0.720]||
|using|**3.28μs**|11.9μs [0.275]||
