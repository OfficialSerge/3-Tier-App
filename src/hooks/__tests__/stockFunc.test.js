import { cleanup, renderHook } from '@testing-library/react'

import { useStockFunc } from '../stockFunc'
import { SPX_TEST, JPM_TEST } from './testData'

afterAll(() => {
  cleanup()
})

describe('unit testing useStockFunc', () => {
  const { result } = renderHook(() => useStockFunc())
  const [
    stock_data_ignore, // not for testing
    plot_data_ignore,  // not for testing

    dailyLogReturns,
    historicReturns,
    beta,
    downSideBeta,
    mean,
    standardDev
  ] = result.current


  test('test mean function with positive input', () => {
    const input = [1.0, 2.0, 3.0, 4.0, 5.0]
    const output = 3.0

    expect(mean(input)).toEqual(output)
  })

  test('test mean function with negative input', () => {
    const input = [1.0, -2.0, 3.0, -4.0, -5.0]
    const output = -1.4

    expect(mean(input)).toEqual(output)
  })

  test('test dailyLogReturns function', () => {    
    const input = dailyLogReturns(JPM_TEST)
    const output = [
      0.0511943,
      -0.0032669,
      -0.0198009,
      0.0253955,
      0.0411421,
      0.0165038,
      0.0541028,
      0.0160533,
      -0.0292845,
      -0.0093853,
      -0.0201763,
      -0.0205929,
      -0.0213308,
      0.0457222,
      0.0304410,
      -0.0157603,
      -0.0170912,
      0.0200156,
      -0.0088413,
      -0.0217672
    ]

    for (let i = 0; i < input.length; i++) {
      expect(input[i]).toBeCloseTo(output[i])
    }
  })
  test('test historicReturns function', () => {
    const input = historicReturns(JPM_TEST)
    const output = 0.119937

    expect(input).toBeCloseTo(output)
  })
  test('test beta function: JPM & SPX', () => {
    const JPM_LogReturns = dailyLogReturns(JPM_TEST)
    const SPX_LogReturns = dailyLogReturns(SPX_TEST)

    const input = beta(JPM_LogReturns, SPX_LogReturns)
    const output = 1.278680091

    expect(input).toBeCloseTo(output)
  })
  test('test beta function: SPX with itself, should be 1', () => {
    const SPX_LogReturns = dailyLogReturns(SPX_TEST)

    const input = beta(SPX_LogReturns, SPX_LogReturns)
    const output = 1

    expect(input).toEqual(output)
  })
  test('test standardDev function', () => {
    const JPM_LogReturns = dailyLogReturns(JPM_TEST)
    const ave = mean(JPM_LogReturns)

    const input = standardDev(JPM_LogReturns, ave)
    const output = 0.028021573

    expect(input).toBeCloseTo(output)
  })
  test('test downSideBeta function', () => {
    const JPM_LogReturns = dailyLogReturns(JPM_TEST)
    const SPX_LogReturns = dailyLogReturns(SPX_TEST)

    const input = downSideBeta(JPM_LogReturns, SPX_LogReturns)
    const output = 1.0006156

    expect(input).toBeCloseTo(output)
  })
})