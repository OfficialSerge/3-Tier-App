import './Plots.css'

import Plot from 'react-plotly.js'

import { useState } from 'react'

const COLORS = [
  '#ff595e', '#ff924c', '#ffca3a', '#c5ca30', '#8ac926',
  '#36949d', '#1982c4', '#4267ac', '#565aa0', '#6a4c93'
]

export const Plots = ({ stockBook, loading, plotData }) => {
  const [selectedPort, setPort] = useState(null)

  function handleClick(data) {
    const volatility = data.points[0].x
    const expReturn = data.points[0].y

    for (const [port, data] of Object.entries(plotData)) {
      if (data.volatility === volatility) {
        setPort(port)
      }
    }
  }

  return (
    <Plot
      className='plot'
      onClick={(data) => handleClick(data)}
      data={[
        {
          type: 'scatter',
          mode: 'markers',
          x: Object.values(plotData).map((row) => { return row.volatility }) || [],
          y: Object.values(plotData).map((row) => { return row.annualReturn }) || [],
          hoverinfo: 'x+y+text',
          hovertext: 'Sharpe Ratio',
          marker: {
            size: 5,
            color: Object.values(plotData).map((row) => { return row.sharpeRatio }) || [],
            colorscale: 'Greens'
          }
        },
        {
          type: 'scatter',
          mode: 'markers',
          x: Object.values(stockBook).map((val) => { return val.annualStDev }) || [],
          y: Object.values(stockBook).map((val) => { return val.annualHistRet }) || [],
          text: Object.keys(stockBook).map((key) => { return key }) || [],
          textfont: {
            family: 'Courier New, monospace',
            color: 'white',
            size: 18
          },
          textposition: 'bottom center',
          mode: 'markers+text',
          hoverinfo: 'none',
          marker: {
            size: 10,
            color: 'Red'
          }
        },
        {
          type: 'pie',
          values: selectedPort && Object.values(plotData[selectedPort].weights).map((weight) => { return weight }),
          labels: selectedPort && Object.keys(plotData[selectedPort].weights).map((stock) => { return stock }),
          textinfo: "label+percent",
          textposition: "outside",
          textfont: {
            family: 'Courier New, monospace',
            color: 'white',
            size: 18
          },
          marker: {
            colors: COLORS
          },
          hoverinfo: 'none',
          domain: {
            x: [0.7, 1]
          }
        }
      ]}
      layout={{
        paper_bgcolor: 'rgba(255,255,255,0)',
        plot_bgcolor: 'rgba(255,255,255,0)',
        template: 'ggplot2',
        title: {
          text: 'Efficient Frontier + Stock Breakdown',
          font: {
            family: 'Courier New, monospace',
            color: 'white',
            size: 24
          },
          x: 0.05,
        },
        xaxis: {
          gridcolor: 'rgba(255,255,255,0.5)',
          domain: [0, 0.6],
          title: {
            text: 'Volatility',
            font: {
              family: 'Courier New, monospace',
              color: 'white',
              size: 18,
            }
          },
          tickformat: '.0%',
          tickfont: {
            color: 'white',
            size: 14
          }
        },
        yaxis: {
          gridcolor: 'rgba(255,255,255,0.5)',
          title: {
            text: 'Expected Returns',
            font: {
              family: 'Courier New, monospace',
              color: 'white',
              size: 18,
            }
          },
          tickformat: '.0%',
          tickfont: {
            color: 'white',
            size: 14
          },
          dtick: 0.1
        },
        margin: {
          pad: 10,
          l: 100,
          r: 100,
          b: 75,
          t: 75
        },
        showlegend: false,
        autosize: true
      }}
    />
  )
}