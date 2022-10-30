import { useMemo } from "react"

export const useStockFunc = (response, annualTargetReturn, annualRFR) => {
  const [stockBook, plotData] = useMemo(() => {
    if (!response) return [null, null]

    const dataForPlot = [], dataForBook = []
    
    // we FIRST need to grab information on the market (S&P),
    // this will serve as a basis for which to contrast 
    // the stocks returned by our API/DB call
    const SPX = response.filter(stock => stock.meta.symbol === "SPX")[0]
    const marketDailyLogs = dailyLogReturns(SPX)

    // count of number of stocks in our response object,
    // this will be one less than total b.c SPX is an
    // index for the S&P which is used as market data
    const numStocks = response.length - 1

    // we grab discriptive statistic on a per stock basis and the market
    for (const stock of response) {
      const stats = getDescriptiveStats(stock, marketDailyLogs)
      dataForBook.push(stats)
    }

    // sumulate 1000 randomly weighted portfolios
    for (let i = 0; i < 1000; i++) {
      const data = {}

      // Generate random weights for our simulated portfolio
      const weights = Array.from({ length: numStocks }, () => Math.random())
      const totalWeight = weights.reduce((a, b) => a + b)

      weights.forEach((weight, i) => {
        weights[i] = weight / totalWeight
      })

      data['weights'] = {}
      dataForBook.slice(1).forEach((key, i) => {
        data['weights'][key.symbol] = weights[i]
      })

      const [annualSTD, downVol, upVar, downVar, annualWeightedRet] = simulateWeights(weights, dataForBook, marketDailyLogs)

      data['upSideVarPercent'] = upVar / (upVar + downVar) * 100
      data['downSideVarPercent'] = downVar / (upVar + downVar) * 100
      data['sharpeRatio'] = (annualWeightedRet - annualRFR) / annualSTD
      data['sortinoRatio'] = (annualWeightedRet - annualTargetReturn) / downVol
      data['volatility'] = annualSTD
      data['downSideVolatility'] = downVol
      data['annualReturn'] = annualWeightedRet
      data['volatilitySkewness'] = upVar / downVar

      // add iteration to our array
      dataForPlot.push(data)
    }

    return [dataForBook, dataForPlot]

  }, [response])

  /**
   * @param {object} stock json object representing stock information and daily closing prices
   * @return {array<float>} array representing the daily log returns for given timeseries
   */
  function dailyLogReturns(stock) {
    const logValues = []

    // grab todays closing price
    let final = stock.values[0]['close']

    // compare today with yesterday
    stock.values.slice(1).map((row) => {
      const initial = row['close']

      logValues.push(Math.log(final / initial))
      final = initial
    })
    return logValues
  }

  /**
   * @param {object} stock json object representing stock information and daily closing prices
   * @return {float} the annualized, historic returns for a given timeseries
   */
  function historicReturns(stock) {
    const final = stock.values[0]['close']
    const initial = stock.values[stock.values.length - 1]['close']

    return (final / initial) - 1
  }

  /**
   * @param {array<float>} stockDailyLogs the annual daily log returns for a given stock
   * @param {array<float>} marketDailyLogs the annual daily log returns for market
   * @return {float} the beta of the given stock against the S&P
   */
  function beta(stockDailyLogs, marketDailyLogs) {
    const mAve = mean(marketDailyLogs)
    const sAve = mean(stockDailyLogs)

    let sum = 0, sumMarket = 0

    for (const day in marketDailyLogs) {
      sum += (stockDailyLogs[day] - sAve) * (marketDailyLogs[day] - mAve)
      sumMarket += (marketDailyLogs[day] - mAve) ** 2
    }
    return sum / sumMarket
  }

  /**
   * @param {array<float>} stockDailyLogs the annual daily log returns for a given stock
   * @param {array<float>} marketDailyLogs the annual daily log returns for market
   * @return {float} the downside beta of the given stock when contrasted to the S&P 500
   */
  function downSideBeta(stockDailyLogs, marketDailyLogs) {
    const mAve = mean(marketDailyLogs)
    const sAve = mean(stockDailyLogs)

    let sum = 0, sumMarket = 0

    for (const day in marketDailyLogs) {
      if (marketDailyLogs[day] > mAve) continue

      sum += (stockDailyLogs[day] - sAve) * (marketDailyLogs[day] - mAve)
      sumMarket += (marketDailyLogs[day] - mAve) ** 2
    }
    return sum / sumMarket
  }

  /**
   * @param {array<float>} stockDailyLogs the annual daily log returns for a given stock
   * @return {float} the average daily return for given timeseries
   */
  function mean(stockDailyLogs) {
    let sum = 0, length = 0

    for (const daily of stockDailyLogs) {
      sum += daily
      length++
    }

    return (sum / length)
  }

  /**
   * @param {array<float>} stockDailyLogs the annual daily log returns for a given stock
   * @return {float} the daily, stardard deviation for given timeseries
   */
  function standardDev(stockDailyLogs) {
    const sAve = mean(stockDailyLogs)
    let sum = 0, length = 0

    for (const daily of stockDailyLogs) {
      sum += (daily - sAve) ** 2
      length++
    }

    return (sum / (length - 1)) ** 0.5
  }

  /**
   * @param {object} stock json object representing one of our stocks
   * @param {object} marketDailyLogs the annual daily log returns of our market
   * @return {object} a JSON object containing descriptive statistics for the given stock
   * will compute descriptive statistics like standard deviation,
   * beta, expected return, skew, and log returns
   */
  function getDescriptiveStats(stock, marketDailyLogs) {
    const data = {}

    // we will need to collect the daily log returns 
    // of our stock, this will serve as a basis for
    // many subsequent calculations
    const stockDailyLogs = dailyLogReturns(stock)

    // extrapolate key measures using data
    const histRet = historicReturns(stock)
    const stDev = standardDev(stockDailyLogs) * (252 ** 0.5)
    const bta = beta(stockDailyLogs, marketDailyLogs)
    const downbta = downSideBeta(stockDailyLogs, marketDailyLogs)

    // tally the data for each stock in our response
    data['symbol'] = stock.meta.symbol
    data['dailyLogReturns'] = stockDailyLogs
    data['annualHistRet'] = histRet
    data['annualStDev'] = stDev
    data['annualBeta'] = bta
    data['annualDBeta'] = downbta
    data['expAnnualRetCAPM'] = annualRFR + bta * (histRet - annualRFR)
    data['expAnnualRetDCAPM'] = annualRFR + downbta * (histRet - annualRFR)

    return data
  }

  /**
   * @param {array<float>} weights an array of weights to construct a portfolio from
   * @param {array<object>} dataForBook an array of per stock descriptive statistic
   * @param {array<float>} marketDailyLogs the annual daily log returns for market
   * @return {array<float>} [portfolio standard deviation, downside volatility, upside variance, downside variance, annual weighted return]
   * will take the given weights and simulate a single portfolio
   */
  function simulateWeights(weights, dataForBook, marketDailyLogs) {
    let annualWeightedReturn = 0
    const dailyTargetReturn = annualTargetReturn / 252
    const portDailyLogs = [], belowTargetDays = [], upsideDays = [], downsideDays = []

    // do sum product using our weights array and the 
    // daily log returns per stock in our portfolio
    // to get total daily log returns for portfolio
    for (const day in marketDailyLogs) {
      let i = 0, sum = 0

      dataForBook.slice(1).forEach((stock) => {
        sum += stock.dailyLogReturns[day] * weights[i++]
      })

      annualWeightedReturn += sum
      portDailyLogs[day] = sum
    }

    // now get ave daily return and annual standard deviation
    const histDailyReturn = mean(portDailyLogs)
    const histAnnualSTD = standardDev(portDailyLogs) * (252 ** 0.5)

    // belowTargetDays will use our provided target return
    // downsideDays will use the calculated daily returns
    // upsideDays will use the calculated daily returns
    let belowTargetSum = 0, downsideSum = 0, upsideSum = 0

    for (const day in marketDailyLogs) {
      const daily = portDailyLogs[day]

      // belowTargetDays is used to calculate the downside volatility
      // based on our provided level of risk adversity
      belowTargetDays[day] = Math.max(dailyTargetReturn - daily, 0)
      belowTargetSum += belowTargetDays[day] ** 2

      // these two are used to calculate the upside and downside variance
      // of our portfolio based on the historic daily returns
      downsideDays[day] = Math.max(histDailyReturn - daily, 0)
      downsideSum += downsideDays[day] ** 2

      upsideDays[day] = Math.max(daily - histDailyReturn, 0)
      upsideSum += upsideDays[day] ** 2
    }

    const historicDownsideVol = ((belowTargetSum / (marketDailyLogs.length - 1)) ** 0.5) * (252 ** 0.5)
    const historicUpsideVar = (upsideSum / (marketDailyLogs.length - 1))
    const historicDownsideVar = (downsideSum / (marketDailyLogs.length - 1))

    return [histAnnualSTD, historicDownsideVol, historicDownsideVar, historicUpsideVar, annualWeightedReturn]
  }

  return [
    stockBook,
    plotData,
    dailyLogReturns,
    historicReturns,
    beta,
    downSideBeta,
    mean,
    standardDev
  ]
}