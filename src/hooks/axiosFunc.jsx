import { useState, useEffect } from "react";

export const useAxiosFunc = () => {
  const [response, setResponse] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [controller, setController] = useState()

  async function axiosFetch(configObj) {
    const {
      axiosInstance,
      userToken,
      url,
      requestConfig = {}
    } = configObj

    try {
      setLoading(true)

      const ctr = new AbortController()
      setController(ctr)

      const res = await axiosInstance(url, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": "Bearer " + userToken
        },
        ...requestConfig,
        signal: ctr.signal
      })
      
      setResponse(res.data)

    } catch (err) {
      console.log(err)
      setError(err)

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      controller && controller.abort()
    }
  }, [controller])

  return [response, error, loading, axiosFetch]
}