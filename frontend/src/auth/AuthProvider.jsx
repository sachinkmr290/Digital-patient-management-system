import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

function parseJwt(token) {
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(decoded)))
  } catch (e) {
    try {
      return JSON.parse(atob(token.split('.')[1]))
    } catch (e2) {
      return null
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      const payload = parseJwt(token)
      setUser(payload)
    } else {
      setUser(null)
    }
  }, [])

  const login = (token) => {
    localStorage.setItem('access_token', token)
    const payload = parseJwt(token)
    setUser(payload)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export default AuthContext
