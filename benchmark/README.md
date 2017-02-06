## Benchmark 

(using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Libraries
- Aigle v0.0.0
- Bluebird v3.4.7
- neoAsync v2.0.1

### Results
|benchmark|aigle|bluebird|neoAsync|
|---|---|---|---|
|all|**18.3μs**|20.5μs [0.894]||
|all:async|**30.7μs**|42.9μs [0.716]||
|join:1|0.799μs [0.808]|**0.645μs**||
|join:5|1.28μs [0.731]|**0.937μs**||
|join:10|**1.52μs**|2.68μs [0.569]||
|map:array|11.2μs [0.622]|12.3μs [0.566]|**6.96μs**|
|map:array:async|45.8μs [0.461]|114μs [0.186]|**21.1μs**|
|promise:single|0.840μs [0.645]|**0.541μs**||
|promise:single:async|**2.24μs**|3.70μs [0.606]||
|promise:multiple|32.0μs [0.796]|**25.4μs**||
|promise:multiple:async|**202μs**|348μs [0.580]||
|promisify:simple|**2.25μs**|27.9μs [0.0807]||
|promisify:multiple|**3.04μs**|29.1μs [0.104]||
|promisifyAll|**29.9μs**|117μs [0.255]||
|props|51.3μs [0.917]|**47.0μs**||
|props:async|**71.0μs**|75.6μs [0.939]||
|race|**29.8μs**|32.8μs [0.909]||
|race:async|44.1μs [0.998]|**44.0μs**||
|spread:10|2.25μs [0.862]|**1.94μs**||
|spread:100|**6.16μs**|9.13μs [0.674]||
