import './Dashboard.css'

import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import { Plots } from './Plots'

import axios from '../hooks/serverAPI'
import { useAxiosFunc } from '../hooks/axiosFunc'
import { useStockFunc } from '../hooks/stockFunc'

export const Dashboard = () => {
  const [error, setError] = useState('')
  const [ticks, setTicks] = useState(['KO', 'JPM', 'DIS', 'WMT', 'MSFT', 'PFE', 'CAT'])
  const [annualTargetReturn, setTarget] = useState(0.10)
  const [annualRFR, setRFR] = useState(0.0417)
  const [stockBook, setStockBook] = useState({})
  const [plotData, setPlot] = useState({})
  const [SP500, setSP] = useState({})
  const newStock = useRef()

  const [response, stockDataErr, loading, axiosFetch] = useAxiosFunc()
  const [buildPortfolio] = useStockFunc(stockBook, SP500, annualTargetReturn, annualRFR)

  const { currentUser, userToken, logout } = useAuth()

  const navigate = useNavigate()

  async function handleLogout(e) {
    e.preventDefault()

    try {
      await logout()
      navigate('/login')

    } catch (err) {
      setError(err)
      console.log(error)
    }
  }

  function handleProfileUpdate(e) {
    e.preventDefault()
    navigate('/update-profile')
  }

  function addStock(e) {
    e.preventDefault()
    const currStocks = ticks

    if (ticks.length === 10) return
    if (!newStock.current.value) return
    if (currStocks.includes(newStock.current.value.toUpperCase())) return

    setTicks([...ticks, newStock.current.value.toUpperCase()])
    newStock.current.value = null
  }

  function deleteStock(symbol) {
    const currStocks = ticks

    const lessStocks = currStocks.filter((stock) => stock !== symbol)
    setTicks([...lessStocks])
  }

  async function getStockData(e) {
    e.preventDefault()

    if (ticks.length < 3) return

    const configObj = {
      axiosInstance: axios,
      url: '/',
      userToken,
      requestConfig: {
        params: {
          ticks: ['SPX', ...ticks], // SPX is S&P 500
          interval: '1day',
          outputsize: 252
        }
      }
    }
    await axiosFetch(configObj)
    buildPortfolio(response, plotData)
  }

  return (
    <div className="dashboard">
      <div className="stocks">
        {ticks && ticks.map((symbol) => {
          return <div className="symbol" key={symbol} onClick={() => deleteStock(symbol)}>{symbol}</div>
        })}
        {ticks.length < 10 &&
          <div className="newSymbol">
            <form onSubmit={(event) => addStock(event)}>
              <input type="text" placeholder='TICKER' ref={newStock} />
            </form>
          </div>
        }
        <div className="hide">
          <button className="queryData" onClick={(event) => getStockData(event)}>FETCH DATA</button>
        </div>
      </div>
      <Plots
        stockBook={stockBook}
        plotData={plotData}
        loading={loading}
      />
      <div className="infoPannel">
        <p><Link style={{ 'color': 'var(--grey)' }} onClick={(event) => handleLogout(event)}>Log Out</Link></p>
        <p><Link to='/update-profile' style={{ 'color': 'var(--grey)' }} onClick={(event) => handleProfileUpdate(event)}>Update Profile</Link></p>
      </div>
    </div>
  )
}