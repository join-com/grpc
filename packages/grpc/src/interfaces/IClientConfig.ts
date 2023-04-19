import * as grpc from '@grpc/grpc-js'
import { Consistency } from '../metadata/Consistency'
import { INoDebugLogger } from './ILogger'

// IgnoreMe shouldn't be used - it's for backward compatibility with the old version that has obtained a type parameter
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ISimplifiedClientConfig<_IgnoreMe = never> {
  address: string
  credentials?: grpc.ChannelCredentials
  options?: Partial<grpc.ChannelOptions>
  logger?: INoDebugLogger
  /**
   * **Please reach out to the platform team before changing this parameter.**
   *
   * Set the default consistency level for all **read methods** of this client.
   *
   * Eventually consistent data stores provide better performance and reliability than a strongly consistent one.
   * But careful application design is necessitated to leverage them correctly.
   *
   * If set to `eventual`, the server handling the request will have the possibility to reach out (or not reach out)
   * an eventual consistent data store (e.g: A read-replica) for the operation.
   *
   * Only read methods (e.g: findOne or list) will follow this consistency level.
   *
   * *Monotonic read-consistency* is currently guaranteed but this is subject to change in the future,
   * you can assume it will always be guaranteed across usage of the client **within** the same UseCase.
   * Please reach out to the platform team if you have questions about this.
   *
   * If this property is not set, the choice of `strong` or `eventual` consistency for read methods will be the one
   * specified in the API documentation of each client's method.
   * If the client's method's documentation does not specify the default consistency level, then it is `strong`.
   *
   * You can override the consistency level on a per-call basis by passing a consistency metadata provided
   * in this library.
   *
   * Write methods are **always** strongly consistent.
   *
   * @see Consistency
   * */
  consistency?: Consistency
}

export interface IClientConfig<ServiceImplementationType = grpc.UntypedServiceImplementation>
  extends ISimplifiedClientConfig {
  serviceDefinition: grpc.ServiceDefinition<ServiceImplementationType>
  credentials: grpc.ChannelCredentials
}
