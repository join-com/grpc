import { ServerUnaryCall } from '../types/BackwardCompatibleCalls'

export type Consistency = 'strong' | 'eventual'
export const consistencyMetadataKey = 'com.join.consistency'
export const strongConsistencyMetadata = { [consistencyMetadataKey]: 'strong' } as const
export const eventualConsistencyMetadata = { [consistencyMetadataKey]: 'eventual' } as const
export const getConsistency = (call: ServerUnaryCall<unknown>): Consistency => {
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
