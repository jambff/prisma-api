# Jambff Prisma API

Extends [@jambff/api](https://www.npmjs.com/package/@jambff/api) with
additional helpers for APIs built using [Prisma](https://www.prisma.io/).

## Installation

Install with your favourite package manager:

```text
yarn add @jambff/prisma-api
```

You should also install all `peerDependencies`.

## Search query parser

Parses a query string to the format required for a Prisma where query. Supports
nested object queries via dot notation.

```js
import { parseFilterQuery, FilterType } from '@jambff/prisma-api';
import qs from 'qs';

const queryString = '?filter[published]=true&filter[imageId]=lte:10&filter[image]=title.contains:something';
const queryObject = qs.parse(queryString, { arrayFormat: 'brackets' });

const filterTypes = {
  published: FilterType.BOOLEAN,
  imageId: FilterType.NUMBER,
  image: {
    title: FilterType.STRING,
  },
};

const prismaQuery = parseFilterQuery(filterTypes, queryObject);
// [
//   { published: true },
//   { imageId: { lte: 10 },
//   { image: { title: { contains: "something" } },
// }
```
