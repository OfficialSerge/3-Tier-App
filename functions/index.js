import admin from 'firebase-admin'
import functions from 'firebase-functions'

import { db } from './firebase.js'
import { connectFirestoreEmulator, doc, getDoc, setDoc } from "firebase/firestore"

import { validateFirebaseIdToken } from './authMiddleware.js'

import axios from './hooks/stockAPI.js'
import express from 'express'
import cors from 'cors'

admin.initializeApp()

const app = express()
app.use(cors({ origin: true }))
app.use(validateFirebaseIdToken)

// connectFirestoreEmulator(db, "localhost", 8080, {
//   ssl: false
// })

// Query DataBase, otherwise hit stockAPI
async function getStockData(params) {
  const { symbol, outputsize } = params

  const stockDocRef = doc(db, "annual data", symbol)

  try {
    const stockSnap = await getDoc(stockDocRef)

    if (!stockSnap.exists()) {
      functions.logger.log('API HIT')
      const { data } = await axios({
        params
      })
      setDoc(stockDocRef, data)
      return data
    }
    functions.logger.log('DATABASE HIT')
    return stockSnap.data()

  } catch (error) {
    functions.logger.log(error)
    return error
  }
}

app.get('/', async (req, res) => {
  const {
    ticks,
    interval,
    outputsize
  } = req.query

  const result = []

  await Promise.all(ticks.map(async (symbol) => {
    const response = await getStockData({
      symbol,
      interval,
      outputsize
    })
    result.push(response)
  }))

  res.send(result)
})

export default functions.https.onRequest(app)


