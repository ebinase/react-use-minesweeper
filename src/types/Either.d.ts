export type Either<L, R> = { kind: 'Left'; value: L } | { kind: 'Right'; value: R };
