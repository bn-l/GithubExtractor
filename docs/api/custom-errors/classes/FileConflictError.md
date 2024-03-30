[github-extractor](../../index.md) / [custom-errors](../index.md) / FileConflictError

# FileConflictError

## Extends

- `Error`

## Constructors

### new FileConflictError(message, __namedParameters)

```ts
new FileConflictError(message, __namedParameters): FileConflictError
```

#### Parameters

• **message**: `string`

• **\_\_namedParameters**

• **\_\_namedParameters\.conflicts?**: `string`[]

#### Returns

[`FileConflictError`](FileConflictError.md)

#### Overrides

`Error.constructor`

#### Source

[source/custom-errors.mts:5](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/custom-errors.mts#L5)

## Properties

### cause?

```ts
optional cause: unknown;
```

#### Inherited from

`Error.cause`

#### Source

node\_modules/typescript/lib/lib.es2022.error.d.ts:24

***

### conflicts

```ts
conflicts: undefined | string[];
```

#### Source

[source/custom-errors.mts:3](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/custom-errors.mts#L3)

***

### message

```ts
message: string;
```

#### Inherited from

`Error.message`

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1077

***

### name

```ts
name: string;
```

#### Inherited from

`Error.name`

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1076

***

### stack?

```ts
optional stack: string;
```

#### Inherited from

`Error.stack`

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1078

***

### prepareStackTrace()?

```ts
static optional prepareStackTrace: (err, stackTraces) => any;
```

Optional override for formatting stack traces

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Parameters

• **err**: `Error`

• **stackTraces**: `CallSite`[]

#### Returns

`any`

#### Inherited from

`Error.prepareStackTrace`

#### Source

node\_modules/@types/node/globals.d.ts:28

***

### stackTraceLimit

```ts
static stackTraceLimit: number;
```

#### Inherited from

`Error.stackTraceLimit`

#### Source

node\_modules/@types/node/globals.d.ts:30

## Methods

### captureStackTrace()

```ts
static captureStackTrace(targetObject, constructorOpt?): void
```

Create .stack property on a target object

#### Parameters

• **targetObject**: `object`

• **constructorOpt?**: `Function`

#### Returns

`void`

#### Inherited from

`Error.captureStackTrace`

#### Source

node\_modules/@types/node/globals.d.ts:21
