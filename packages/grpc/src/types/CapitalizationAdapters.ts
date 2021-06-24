export type UncapitalizedMethodNames<ServiceImplementationType> =
  keyof ServiceImplementationType extends string
    ? Uncapitalize<keyof ServiceImplementationType>
    : keyof ServiceImplementationType

export type CondCapitalize<S> = S extends string ? Capitalize<S> : S
