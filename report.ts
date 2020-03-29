import * as async from 'async'
import {stat, Stats} from 'fs'

export interface CompressionResult {
  original: number
  converted: number
  percentage: number
  message: string
}

export function reportCompressionResult(
  original: string,
  converted: string,
  callback: (error: Error, stats?: CompressionResult) => void,
) {
  async.parallel(
    {
      originalStats: async.apply(stat, original),
      convertedStats: async.apply(stat, converted),
    },
    (error, {originalStats, convertedStats}: {[index: string]: Stats}) => {
      if (error) return callback(error)
      const percentage = (100.0 * convertedStats.size) / originalStats.size
      callback(null, {
        original: originalStats.size,
        converted: convertedStats.size,
        percentage,
        message: `recompressed version of ${original} is ${percentage.toFixed(2)}% the size of the original`,
      })
    },
  )
}
