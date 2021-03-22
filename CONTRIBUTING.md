# Coding Rules

## Class definitions

1. Every defined class should have its interface counterpart to ease testing and refactoring.
2. Methods ordering:
   1. In first place, the constructor.
   2. In second place, public methods, ordered lexicographically.
   3. In third place, private methods, ordered lexicographically.
3. Mark properties as `private` when possible.
4. Mark properties as `readonly` when possible.

## Testing

In general terms, try to keep the tests as close as possible to the production code.

An example of what **NOT** to do:
```
__tests__/
  a/
    A1.test.ts
    A2.test.ts
  b/
    B1.test.ts
    B2.test.ts
src/
  a/
    A1.ts
    A2.ts
  b/
    B1.ts
    B2.ts
```

An example of how it should be:
```
src/
  a/
    __tests__/
      A1.test.ts
      A2.test.ts
    A1.ts
    A2.ts
  b/
    __tests__/
      B1.test.ts
      B2.test.ts
    B1.ts
    B2.ts
```
