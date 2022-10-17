import './Signup.css'

import { useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export const ForgotPassword = () => {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef()
  const passRef = useRef()

  const { resetPass } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()

    if (!emailRef.current.value || !passRef.current.value) {
      return setError('MISSING FIELD')
    }

    try {
      setError('')
      setLoading(true)
      await resetPass(emailRef.current.value)

    } catch (err) {
      setError(err)
      console.log(error)

    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="card">
        <h2>Password Reset</h2>
        <form onSubmit={(event) => handleSubmit(event)}>
          <div className="field">
            <input type="text" placeholder='Email' ref={emailRef} />
          </div>
          <div className="field">
            <input type="password" placeholder='Password' ref={passRef} />
          </div>
          <button disabled={loading}>Reset Password</button>
        </form>
        <p>Don't have an account? <Link to='/login' style={{'color':'var(--grey)'}}>Login</Link></p>
      </div>
    </>
  )
}