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

## Properties

### cause?

```ts
optional cause: unknown;
```

#### Inherited from

`Error.cause`

***

### conflicts

```ts
conflicts: undefined | string[];
```

***

### message

```ts
message: string;
```

#### Inherited from

`Error.message`

***

### name

```ts
name: string;
```

#### Inherited from

`Error.name`

***

### stack?

```ts
optional stack: string;
```

#### Inherited from

`Error.stack`

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

***

### stackTraceLimit

```ts
static stackTraceLimit: number;
```

#### Inherited from

`Error.stackTraceLimit`

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
