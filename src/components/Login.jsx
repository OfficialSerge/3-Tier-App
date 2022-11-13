import './Signup.css'

import { useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export const Login = ({ formValid, setFormValid, blueToRed, redToBlue }) => {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef()
  const passRef = useRef()

  const { login } = useAuth()

  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()

    if (!emailRef.current.value || !passRef.current.value) {
      if (formValid) {
        setFormValid(false)
        await blueToRed()
      }
      return setError('MISSING FIELD')
    }

    try {
      setError('')
      setLoading(true)
      await login(emailRef.current.value, passRef.current.value)
      
      if (!formValid) {
        setFormValid(true)
        await redToBlue()
      }

      navigate('/')

    } catch (err) {
      setError(err)

      if (formValid) {
        setFormValid(false)
        await blueToRed()
      }

    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="card">
        <h2>Log In</h2>
        <form onSubmit={(event) => handleSubmit(event)}>
          <div className="field">
            <input type="text" placeholder='Email' ref={emailRef} />
          </div>
          <div className="field">
            <input type="password" placeholder='Password' ref={passRef} />
          </div>
          <button disabled={loading}>Log In</button>
        </form>
        <p>Don't have an account? <Link to='/signup' style={{ 'color': 'var(--grey)' }}>Sign Up</Link>
          &ensp;<Link to='/forgot-password' style={{ 'color': 'var(--grey)' }}>Forgot Password</Link>
        </p>
      </div>
    </>
  )
}