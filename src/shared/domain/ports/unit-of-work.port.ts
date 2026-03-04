export interface IUnitOfWork {
  run<T>(work: (tx?: unknown) => Promise<T>): Promise<T>;
}
