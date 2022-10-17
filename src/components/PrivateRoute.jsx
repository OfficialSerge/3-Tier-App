import React from "react"
import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export const PrivateRoute = ({ element: Element, ...rest }) => {
  const { currentUser } = useAuth()

  return (
    currentUser ? <Outlet /> : <Navigate to='/login' />
  )
}
