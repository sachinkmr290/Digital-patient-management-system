import React, { useState } from 'react'
import { TextField, Button, Box, Paper, Typography, InputAdornment, IconButton, Tabs, Tab } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import BadgeIcon from '@mui/icons-material/Badge'
import api from '../api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function Login() {
  const [tab, setTab] = useState(0) // 0 = Sign In, 1 = Sign Up

  // Sign In state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loginError, setLoginError] = useState(null)

  // Sign Up state
  const [regName, setRegName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [showRegPass, setShowRegPass] = useState(false)
  const [regError, setRegError] = useState(null)
  const [regSuccess, setRegSuccess] = useState(null)

  const nav = useNavigate()
  const auth = useAuth()

  const submitLogin = async (e) => {
    e.preventDefault()
    setLoginError(null)
    try {
      const res = await api.post('/api/auth/login', { username, password })
      auth.login(res.data.access_token)
      nav('/')
    } catch (err) {
      setLoginError(err.response?.data?.msg || 'Login failed')
    }
  }

  const submitRegister = async (e) => {
    e.preventDefault()
    setRegError(null)
    setRegSuccess(null)
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match')
      return
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters')
      return
    }
    try {
      await api.post('/api/auth/register', {
        username: regUsername,
        password: regPassword,
        full_name: regName,
        role: 'Doctor'
      })
      setRegSuccess('Account created successfully! You can now sign in.')
      setRegName('')
      setRegUsername('')
      setRegPassword('')
      setRegConfirm('')
    } catch (err) {
      setRegError(err.response?.data?.msg || 'Registration failed')
    }
  }

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      color: '#fff',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
      '&:hover fieldset': { borderColor: '#6366F1' },
      '&.Mui-focused fieldset': { borderColor: '#6366F1' },
    },
    '& .MuiInputLabel-root': { color: '#94a3b8' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#6366F1' },
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        {/* Clinic Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            backgroundColor: '#fff',
            borderRadius: 3,
            px: 3, py: 2,
            display: 'inline-block',
            mb: 1.5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <Box
              component="img"
              src="/clinic-logo.png"
              alt="Dr. Chauhan Clinic and Therapy Center"
              sx={{
                width: 220,
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
            Patient Management System
          </Typography>
        </Box>

        {/* Card */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(e, v) => { setTab(v); setLoginError(null); setRegError(null); setRegSuccess(null) }}
            variant="fullWidth"
            sx={{
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              '& .MuiTab-root': { color: '#94a3b8', textTransform: 'none', fontWeight: 500, fontSize: '0.95rem' },
              '& .Mui-selected': { color: '#fff !important', fontWeight: 700 },
              '& .MuiTabs-indicator': { backgroundColor: '#6366F1', height: 3 },
            }}
          >
            <Tab label="Sign In" />
            <Tab label="Doctor Sign Up" />
          </Tabs>

          <Box sx={{ p: 4 }}>
            {/* ── SIGN IN ── */}
            {tab === 0 && (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}>
                  Welcome back
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                  Sign in to access the clinic dashboard
                </Typography>
                <form onSubmit={submitLogin}>
                  <TextField
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#6366F1', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />
                  <TextField
                    label="Password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: '#6366F1', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPass(!showPass)} edge="end" size="small">
                            {showPass
                              ? <VisibilityOffIcon sx={{ color: '#64748b', fontSize: 18 }} />
                              : <VisibilityIcon sx={{ color: '#64748b', fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />

                  {loginError && (
                    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <Typography variant="body2" sx={{ color: '#f87171', fontSize: '0.85rem' }}>
                        {loginError}
                      </Typography>
                    </Box>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      mt: 3, py: 1.4, fontWeight: 700, fontSize: '1rem', borderRadius: 2,
                      background: 'linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)',
                      boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                      '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' },
                    }}
                  >
                    Sign In
                  </Button>
                </form>
              </>
            )}

            {/* ── DOCTOR SIGN UP ── */}
            {tab === 1 && (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}>
                  Doctor Registration
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                  Create your doctor account to access the system
                </Typography>
                <form onSubmit={submitRegister}>
                  <TextField
                    label="Full Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon sx={{ color: '#6366F1', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />
                  <TextField
                    label="Username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#6366F1', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />
                  <TextField
                    label="Password"
                    type={showRegPass ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: '#6366F1', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowRegPass(!showRegPass)} edge="end" size="small">
                            {showRegPass
                              ? <VisibilityOffIcon sx={{ color: '#64748b', fontSize: 18 }} />
                              : <VisibilityIcon sx={{ color: '#64748b', fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />
                  <TextField
                    label="Confirm Password"
                    type={showRegPass ? 'text' : 'password'}
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: '#6366F1', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />

                  {regError && (
                    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <Typography variant="body2" sx={{ color: '#f87171', fontSize: '0.85rem' }}>
                        {regError}
                      </Typography>
                    </Box>
                  )}
                  {regSuccess && (
                    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                      <Typography variant="body2" sx={{ color: '#4ade80', fontSize: '0.85rem' }}>
                        {regSuccess}
                      </Typography>
                    </Box>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      mt: 3, py: 1.4, fontWeight: 700, fontSize: '1rem', borderRadius: 2,
                      background: 'linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)',
                      boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                      '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' },
                    }}
                  >
                    Create Doctor Account
                  </Button>
                </form>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
