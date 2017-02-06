## Benchmark (using [benchmark.js](https://github.com/bestiejs/benchmark.js))

### Libraries
- [Aigle] version:0.0.0
- [Bluebird] version:3.4.7
- [neoAsync] version:2.0.1

### Results
|benchmark|aigle|bluebird|neoAsync|
|---|---|---|---|
|promise:all|18.7μs [0.590]|23.2μs [0.474]|**11.0μs**|
|promise:all:async|38.2μs [0.557]|45.2μs [0.470]|**21.3μs**|
