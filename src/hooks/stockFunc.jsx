export const useStockFunc = (stockBook, SP500, annualTargetReturn, annualRFR) => {
  /**
   * @param {object} timeseries the JSON response object from making an API call
   * @param {object} plotData react state variable that will be populated with portfolios
   * of random weights
   */
  function buildPortfolio(timeseries, plotData) {
    const numStocks = timeseries.length - 1

    // clear any and all prior history before adding new data
    for (const [key, data] of Object.entries(stockBook)) {
      delete stockBook[key]
    }

    // calculate descriptive statistics on a per stock basis
    getDescriptiveStats(timeseries)

    // sumulate 1000 randomly weighted portfolios
    for (let i = 0; i < 1000; i++) {
      plotData[i] = {}
      const weights = Array.from({ length: numStocks }, () => Math.random())
      const totalWeight = weights.reduce((a, b) => a + b)

      weights.forEach((weight, i) => {
        weights[i] = weight / totalWeight
      })

      plotData[i]['weights'] = {}
      Object.keys(stockBook).map((key, j) => {
        plotData[i]['weights'][key] = weights[j]
      })

      const [annualSTD, downVol, upVar, downVar, annualWeightedRet] = simulateWeights(weights)

      plotData[i]['upSideVarPercent'] = upVar / (upVar + downVar) * 100
      plotData[i]['downSideVarPercent'] = downVar / (upVar + downVar) * 100
      plotData[i]['sharpeRatio'] = (annualWeightedRet - annualRFR) / annualSTD
      plotData[i]['sortinoRatio'] = (annualWeightedRet - annualTargetReturn) / downVol
      plotData[i]['volatility'] = annualSTD
      plotData[i]['downSideVolatility'] = downVol
      plotData[i]['annualReturn'] = annualWeightedRet
      plotData[i]['volatilitySkewness'] = upVar / downVar
    }
  }

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
    const compoundAnnual = stock.values.length / 252

    return (final / initial) ** (252 / stock.values.length) - 1
  }

  /**
   * @param {array<float>} arr array representing the daily log returns for given timeseries
   * @param {array<float>} sp500 the log returns of the S&P 500 to be compared to arr
   * @return {float} the beta of the given stock when contrasted to the S&P 500
   */
  function beta(arr, sp500) {
    const ave1 = mean(arr), ave2 = mean(sp500)

    let sum = 0, sumMarket = 0

    for (const i in arr) {
      sum += (arr[i] - ave1) * (sp500[i] - ave2)
      sumMarket += (sp500[i] - ave2) ** 2
    }
    return sum / sumMarket
  }

  /**
 * @param {array<float>} arr array representing the daily log returns for given timeseries
 * @param {array<float>} sp500 the log returns of the S&P 500 to be compared to arr
 * @return {float} the downside beta of the given stock when contrasted to the S&P 500
 */
  function downSideBeta(arr, sp500) {
    const downCov = downSideCov(arr, sp500)
    const downVar = downSideVar(sp500, sp500)

    return downCov / downVar
  }

  /**
   * @param {array<float>} arr an array consisting of daily log returns
   * @return {float} the average daily return for given timeseries
   */
  function mean(arr) {
    let sum = 0, length = 0

    for (const daily of arr) {
      sum += daily
      length++
    }

    return (sum / length)
  }

  /**
   * @param {array<float>} arr an array consisting of daily log returns
   * @param {float} ave the mean of log returns for given timeseries arr
   * @return {float} the daily, stardard deviation for given timeseries
   */
  function standardDev(arr, ave) {
    let sum = 0, length = 0

    for (const daily of arr) {
      sum += (daily - ave) ** 2
      length++
    }

    return ((sum / (length - 1)) ** 0.5)
  }

  /**
  * @param {array<float>} arr an array consisting of daily log returns
  * @param {array<float>} sp500 an array consisting of daily log returns
  * @return {float} the daily, stardard deviation for given timeseries
  */
  function downSideCov(arr, sp500) {
    const ave = mean(arr), marketAve = mean(sp500)
    let sum = 0, length = 0

    for (const i in arr) {
      // only for negative values
      if (sp500[i] > marketAve) continue

      sum += (arr[i] - ave) * (sp500[i] - marketAve)
      length++
    }

    return (sum / (length - 1))
  }

  /**
   * @param {array<float>} arr an array consisting of daily log returns
   * @param {array<float>} sp500 an array consisting of daily log returns
   * @return {float} the downside variance of arr 
   */
  function downSideVar(arr, sp500) {
    const ave = mean(arr), marketAve = mean(sp500)
    let sum = 0, length = 0

    for (const i in arr) {
      // only for negative values
      if (sp500[i] > marketAve) continue

      sum += (arr[i] - ave) ** 2
      length++
    }

    return (sum / (length - 1))
  }

  /**
   * @param {object} timeseries the JSON response from our API call
   * will compute, on a per stock basis, descriptive statistics like
   * standard deviation, beta, expected return, skew, and log returns
   */
  function getDescriptiveStats(timeseries) {
    timeseries.map((stock, i) => {
      // get daily log returns for a stock
      const logValues = dailyLogReturns(stock)

      // tally the data for each stock in our response
      stockBook[stock.meta.symbol] = {}
      stockBook[stock.meta.symbol]['dailyLogReturns'] = logValues

      // extrapolate key measures using data
      const his = historicReturns(stock)
      const ave = mean(logValues)
      const std = standardDev(logValues, ave) * (252 ** 0.5)
      const bta = beta(logValues, stockBook['SPX']['dailyLogReturns'])
      const downbta = downSideBeta(logValues, stockBook['SPX']['dailyLogReturns'])

      // tally the metrics for each stock
      stockBook[stock.meta.symbol]['annualHistRet'] = his
      stockBook[stock.meta.symbol]['annualStDev'] = std
      stockBook[stock.meta.symbol]['annualBeta'] = bta
      stockBook[stock.meta.symbol]['annualDBeta'] = downbta
      stockBook[stock.meta.symbol]['expAnnualRetCAPM'] = annualRFR + bta * (stockBook['SPX']['annualHistRet'] - annualRFR)
      stockBook[stock.meta.symbol]['expAnnualRetDCAPM'] = annualRFR + downbta * (stockBook['SPX']['annualHistRet'] - annualRFR)
    })

    // transfer ownership of S&P500 data to SP500 state variable
    SP500['SPX'] = stockBook['SPX']
    delete stockBook.SPX
  }

  /**
   * @param {array<float>} weights a set of random weights to be used to simulate portfolio
   * @return {array<float>} [portfolio standard deviation, downside volatility, upside variance, downside variance, annual weighted return]
   * will take the given weights and simulate a single portfolio
   */
  function simulateWeights(weights) {
    let day = 0, annualWeightedReturn = 0
    const dailies = [], belowTargetDays = [], upsideDays = [], downsideDays = []
    const dailyTargetReturn = annualTargetReturn / 252

    // do sum product using our weights array and the 
    // daily log returns per stock in our portfolio
    // to get total daily log returns for portfolio
    while (day < SP500.SPX.dailyLogReturns.length) {
      let i = 0, sum = 0

      for (const [stock, data] of Object.entries(stockBook)) {
        const daily = data.dailyLogReturns[day], weight = weights[i++]
        sum += daily * weight
      }

      annualWeightedReturn += sum
      dailies[day] = sum
      day++
    }

    // now get ave daily return and annual standard deviation
    const histDailyReturn = mean(dailies)
    const histAnnualSTD = standardDev(dailies, histDailyReturn) * (252 ** 0.5)

    day = 0
    let belowTargetSum = 0, downsideSum = 0, upsideSum = 0
    // belowTargetDays will use our provided target return
    // downsideDays will use the calculated daily returns
    // upsideDays will use the calculated daily returns
    while (day < SP500.SPX.dailyLogReturns.length) {
      const daily = dailies[day]

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
      day++
    }

    const historicDownsideVol = ((belowTargetSum / (SP500.SPX.dailyLogReturns.length - 1)) ** 0.5) * (252 ** 0.5)
    const historicUpsideVar = (upsideSum / (SP500.SPX.dailyLogReturns.length - 1))
    const historicDownsideVar = (downsideSum / (SP500.SPX.dailyLogReturns.length - 1))

    return [histAnnualSTD, historicDownsideVol, historicDownsideVar, historicUpsideVar, annualWeightedReturn]
  }

  return [
    buildPortfolio,
    dailyLogReturns,
    historicReturns,
    beta,
    downSideBeta,
    mean,
    standardDev,
    downSideVar,
    downSideCov
  ]
}