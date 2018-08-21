---
id: install
title: Install
sidebar_label: Install
---

## Node.js / Web

It supports es6 import and require.

```sh
npm install --save aigle
// or
yarn add aigle
```

```js
const Aigle = require('aigle');
const each = require('aigle/each');
```

```js
import Aigle from 'aigle';
import { Aigle } from 'aigle';
import each from 'aigle/each';
```

## TypeScript

Now, type definition is still working in progress, but it has already covered basic functionalities.

```ts
npm install --save aigle@next
// or
yarn add aigle@next
```

```ts
import Aigle from 'aigle';
import { Aigle } from 'aigle';
import each from 'aigle/each';
```

## Async/Await

```js
global.Promise = Aigle;
```

```js
async function getUsers(ids) {
  const users = await Promise.map(ids, getUser);
  const targets = await Promise.filter(users, filterUser);
  return targets;
}

async function getUsers(ids) {
  return await Promise.map(ids, getUser)
    .filter(filterUser);
}
```
