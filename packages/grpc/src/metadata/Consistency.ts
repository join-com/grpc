import { ServerSurfaceCall } from '@grpc/grpc-js/build/src/server-call'

export type Consistency = 'strong' | 'eventual'
export const consistencyMetadataKey = 'com.join.consistency'
export const strongConsistencyMetadata = { [consistencyMetadataKey]: 'strong' } as const
export const eventualConsistencyMetadata = { [consistencyMetadataKey]: 'eventual' } as const

/**
 * Extract the consistency metadata value from the grpc call
 * @param call The grpc call
 * @returns The consistency metadata value, or `strong` if not found
 * @throws Error if more than one metadata is provided for the key {@link consistencyMetadataKey}
 * @throws Error if the consistency metadata value provided cannot be assigned to {@link Consistency}
 */
export const getConsistency = (call: ServerSurfaceCall): Consistency => {
  const consistencyMetadataList = call.metadata.get(consistencyMetadataKey)
  if (consistencyMetadataList.length > 1) {
    throw new Error(
      `Too many metadata provided for ${consistencyMetadataKey}! Max: 1, Current: ${consistencyMetadataList.length}`,
    )
  }
  if (consistencyMetadataList.length === 0) {
    return 'strong'
  }
  if (consistencyMetadataList[0] === 'strong') {
    return 'strong'
  }
  if (consistencyMetadataList[0] === 'eventual') {
    return 'eventual'
  }
  const metadataProvided = consistencyMetadataList[0] ?? 'undefined'
  throw new Error(`Invalid ${consistencyMetadataKey} metadata! Provided: ${metadataProvided.toString()}`)
}
