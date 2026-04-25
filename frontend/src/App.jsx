import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PatientDetail from './pages/PatientDetail'
import { useAuth } from './auth/AuthProvider'
import SidebarLayout from './components/SidebarLayout'

// Modern Premium Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366F1', // Indigo premium color
      light: '#818CF8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#EC4899', // Pink accent
    },
    background: {
      default: '#F9FAFB', // Light gray background
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8, // Changed to 8 matching the crisp interface in the image reference
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4, // More crisp
          padding: '8px 16px',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          marginBottom: '8px'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
})

function PrivateRoute({ children }) {
  const token = localStorage.getItem('access_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SidebarLayout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/patients/:patient_id" element={<PrivateRoute><PatientDetail/></PrivateRoute>} />
        </Routes>
      </SidebarLayout>
    </ThemeProvider>
  )
}
