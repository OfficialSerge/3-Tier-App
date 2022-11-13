import './Signup.css'

import { useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export const Signup = ({ formValid, setFormValid, blueToRed, redToBlue }) => {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef()
  const passRef = useRef()
  const confPassRef = useRef()

  const { signUpFireBase } = useAuth()

  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()

    // handle signup verfification
    if (passRef.current.value !== confPassRef.current.value) {
      if (formValid) {
        setFormValid(false)
        await blueToRed()
      }
      return setError('PASSWORDS DO NOT MATCH')
    }

    if (!emailRef.current.value || !passRef.current.value || !confPassRef.current.value) {
      if (formValid) {
        setFormValid(false)
        await blueToRed()
      }
      return setError('MISSING FIELD')
    }

    try {
      setError('')
      setLoading(true)
      await signUpFireBase(emailRef.current.value, passRef.current.value)

      if (!formValid) {
        setFormValid(true)
        await redToBlue()
      }

      navigate('/')

    } catch (err) {
      setError('Account creating failed')

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
        <h2>Sign Up</h2>
        <form onSubmit={(event) => handleSubmit(event)}>
          <div className="field">
            <input type="text" placeholder='Email' ref={emailRef} />
          </div>
          <div className="field">
            <input type="password" placeholder='Password' ref={passRef} />
          </div>
          <div className="field">
            <input type="password" placeholder='Confirm Password' ref={confPassRef} />
          </div>
          <button disabled={loading}>Create Account</button>
        </form>
        <p>Already have an account? <Link to='/login' style={{ 'color': 'var(--grey)' }}>Log In</Link></p>
      </div>
    </>
  )
}