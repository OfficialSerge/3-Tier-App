import './Signup.css'

import { useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export const UpdateProfile = () => {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef()
  const passRef = useRef()
  const confPassRef = useRef()

  const { updatePass, updateEm } = useAuth()
  
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()

    setLoading(true)

    // handle signup verfification
    if (passRef.current.value !== confPassRef.current.value) {
      return setError('PASSWORDS DO NOT MATCH')
    }

    const promises = []
    if (emailRef.current.value) {
      promises.push(updateEm(emailRef.current.value))
    }

    if (passRef.current.value === confPassRef.current.value) {
      promises.push(updatePass(passRef.current.value))
    }

    Promise.all(promises)
      .then(() => {
        navigate('/')
      })
      .catch((err) => {
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <>
      <div className="card">
        <h2>Update Info</h2>
        <form onSubmit={(event) => handleSubmit(event)}>
          <div className="field">
            <input type="text" placeholder='New Email' ref={emailRef} />
          </div>
          <div className="field">
            <input type="password" placeholder='New Password (optional)' ref={passRef} />
          </div>
          <div className="field">
            <input type="password" placeholder='Confirm Password' ref={confPassRef} />
          </div>
          <button disabled={loading}>Update Settings</button>
        </form>
        <p><Link to='/' style={{ 'color': 'var(--grey)' }}>Cancel</Link></p>
      </div>
    </>
  )
}