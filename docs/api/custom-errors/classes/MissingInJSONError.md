[github-extractor](../../index.md) / [custom-errors](../index.md) / MissingInJSONError

# MissingInJSONError

## Extends

- `Error`

## Constructors

### new MissingInJSONError(message)

```ts
new MissingInJSONError(message): MissingInJSONError
```

#### Parameters

• **message**: `string`

#### Returns

[`MissingInJSONError`](MissingInJSONError.md)

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
