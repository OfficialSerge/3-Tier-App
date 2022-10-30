import Plotly from 'plotly.js-dist-min'

import { useEffect, useState, useRef } from 'react'

const COLORS = [
  '#ff595e', '#ff924c', '#ffca3a', '#c5ca30', '#8ac926',
  '#36949d', '#1982c4', '#4267ac', '#565aa0', '#6a4c93'
]

export const Plots = ({ stockBook, plotData }) => {
  const [selectedPort, setPort] = useState(10)
  const plotRef = useRef(null)

  const trace1 = {
    type: 'scatter',
    mode: 'markers',
    x: plotData.map((row) => { return row.volatility }),
    y: plotData.map((row) => { return row.annualReturn }),
    hoverinfo: 'x+y+text',
    hovertext: 'Sharpe Ratio',
    hovermode: 'closest',
    marker: {
      size: 5,
      color: Object.values(plotData).map((row) => { return row.sharpeRatio }),
      colorscale: 'Greens'
    }
  }

  const trace2 = {
    type: 'scatter',
    mode: 'markers',
    x: stockBook.slice(1).map((val) => { return val.annualStDev }),
    y: stockBook.slice(1).map((val) => { return val.annualHistRet }),
    text: stockBook.slice(1).map((stock) => { return stock.symbol }),
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
  }

  const trace3 = {
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

  const layout = {
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
      pad: 15,
      l: 150,
      r: 150,
      b: 75,
      t: 75
    },
    showlegend: false,
    autosize: true
  }

  function handleClick(data) {
    const volatility = data.points[0].x
    const expReturn = data.points[0].y

    for (const i in plotData) {
      if (plotData[i].volatility === volatility) {
        setPort(i)
      }
    }
  }

  useEffect(() => {
    Plotly.newPlot(plotRef.current, [trace1, trace2, trace3], layout)

    plotRef.current.on('plotly_click', (data) => handleClick(data))
  }, [selectedPort, stockBook])

  return (
    <div className="plot" ref={plotRef}></div>
  )
}