import axios from "axios";

const URL = 'https://twelve-data1.p.rapidapi.com/time_series'

export default axios.create({
  baseURL: URL,
  method: 'GET',
  headers: {
    "X-RapidAPI-Key": process.env.RAPID_API_KEY,
    "X-RapidAPI-Host": process.env.RAPID_API_HOST
  }
}) 