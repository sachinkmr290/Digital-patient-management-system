import React, { useState } from 'react'
import { Box, Tabs, Tab, Paper, Typography } from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PeopleIcon from '@mui/icons-material/People'
import StorefrontIcon from '@mui/icons-material/Storefront'
import WifiIcon from '@mui/icons-material/Wifi'
import PatientForm from '../components/PatientForm'
import PatientList from '../components/PatientList'

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  )
}

function PatientSection({ mode }) {
  const [tab, setTab] = useState(0)
  const isOnline = mode === 'online'
  const accent = isOnline ? '#06b6d4' : '#6366F1'

  return (
    <>
      <Paper sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { minWidth: 'auto', px: 3, textTransform: 'none', fontWeight: 500, fontSize: '0.95rem' },
            '& .Mui-selected': { fontWeight: 700, color: `${accent} !important` },
            '& .MuiTabs-indicator': { backgroundColor: accent, height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          <Tab icon={<PersonAddIcon sx={{ mr: 1 }} />} iconPosition="start" label="Register New Patient" />
          <Tab icon={<PeopleIcon sx={{ mr: 1 }} />} iconPosition="start" label="All Patients" />
        </Tabs>
      </Paper>

      <TabPanel value={tab} index={0}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>
          ➕ Register New {isOnline ? 'Online' : 'Offline'} Patient
        </Typography>
        <PatientForm mode={mode} />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>
          {isOnline ? '🌐 Online' : '🏥 Offline'} Patient Directory
        </Typography>
        <PatientList patientType={mode} />
      </TabPanel>
    </>
  )
}

export default function Dashboard() {
  const [mode, setMode] = useState('offline')

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>Dashboard</Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Dr Chauhan Clinic &amp; Therapy Center — Patient Management
        </Typography>
      </Box>

      {/* ── Top-level Mode Switcher ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {/* Offline */}
        <Box
          onClick={() => setMode('offline')}
          sx={{
            flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
            border: '2px solid',
            borderColor: mode === 'offline' ? '#6366F1' : '#e2e8f0',
            background: mode === 'offline'
              ? 'linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)'
              : '#fff',
            color: mode === 'offline' ? '#fff' : '#64748b',
            transition: 'all 0.22s',
            display: 'flex', alignItems: 'center', gap: 2,
            boxShadow: mode === 'offline' ? '0 6px 24px rgba(99,102,241,0.28)' : 'none',
            '&:hover': { boxShadow: '0 6px 24px rgba(99,102,241,0.18)', borderColor: '#6366F1' },
          }}
        >
          <Box sx={{
            width: 48, height: 48, borderRadius: 2, flexShrink: 0,
            background: mode === 'offline' ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <StorefrontIcon sx={{ fontSize: 26, color: mode === 'offline' ? '#fff' : '#6366F1' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'inherit' }}>
              Offline Patients
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85, color: 'inherit' }}>
              Walk-in clinic visits
            </Typography>
          </Box>
        </Box>

        {/* Online */}
        <Box
          onClick={() => setMode('online')}
          sx={{
            flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
            border: '2px solid',
            borderColor: mode === 'online' ? '#06b6d4' : '#e2e8f0',
            background: mode === 'online'
              ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
              : '#fff',
            color: mode === 'online' ? '#fff' : '#64748b',
            transition: 'all 0.22s',
            display: 'flex', alignItems: 'center', gap: 2,
            boxShadow: mode === 'online' ? '0 6px 24px rgba(6,182,212,0.28)' : 'none',
            '&:hover': { boxShadow: '0 6px 24px rgba(6,182,212,0.18)', borderColor: '#06b6d4' },
          }}
        >
          <Box sx={{
            width: 48, height: 48, borderRadius: 2, flexShrink: 0,
            background: mode === 'online' ? 'rgba(255,255,255,0.2)' : '#f0fdfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <WifiIcon sx={{ fontSize: 26, color: mode === 'online' ? '#fff' : '#06b6d4' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'inherit' }}>
              Online Patients
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85, color: 'inherit' }}>
              Online orders &amp; deliveries
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Patient Section (re-renders on mode change) */}
      <PatientSection key={mode} mode={mode} />
    </Box>
  )
}
