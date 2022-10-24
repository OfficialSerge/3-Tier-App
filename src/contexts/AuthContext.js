import { createContext, useContext, useEffect, useState } from "react"
import { auth } from '../firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updatePassword,
  updateEmail
} from "firebase/auth"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState()
  const [userToken, setToken] = useState()

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUser(user)

        user.getIdToken(true)
          .then((token) => {
            setToken(token)
          })

      } else {
        setCurrentUser(false)
      }
    })

    return unsub
  }, [])

  function signUpFireBase(email, pass) {
    return createUserWithEmailAndPassword(auth, email, pass)
  }

  function login(email, pass) {
    return signInWithEmailAndPassword(auth, email, pass)
  }

  function logout() {
    return signOut(auth)
  }

  function resetPass(email) {
    return sendPasswordResetEmail(auth, email)
  }

  function updateEm(email) {
    return updateEmail(currentUser, email)
  }

  function updatePass(pass) {
    return updatePassword(currentUser, pass)
  }

  const value = {
    currentUser,
    userToken,
    signUpFireBase,
    login,
    logout,
    resetPass,
    updateEm,
    updatePass
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}