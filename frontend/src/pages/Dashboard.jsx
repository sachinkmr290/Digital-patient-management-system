import React, { useState } from 'react'
import { Box, Tabs, Tab, Paper, Typography, Grid, Divider } from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PeopleIcon from '@mui/icons-material/People'
import PatientForm from '../components/PatientForm'
import PatientList from '../components/PatientList'
import AppointmentForm from '../components/AppointmentForm'

function TabPanel(props) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  )
}

export default function Dashboard() {
  const [tabValue, setTabValue] = useState(0)

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
          Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Dr Chauhan Clinic & Therapy Center — Patient Management
        </Typography>
      </Box>

      {/* Tab Navigation */}
      <Paper sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              px: 3,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
            },
            '& .Mui-selected': {
              fontWeight: 700,
              color: '#6366F1 !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#6366F1',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            icon={<PersonAddIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label="New Patient & Appointment"
          />
          <Tab
            icon={<PeopleIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label="All Patients"
          />
        </Tabs>
      </Paper>

      {/* Tab 0: Unified — New Patient + New Appointment */}
      <TabPanel value={tabValue} index={0}>
        <Box>
          {/* Patient Registration */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>
            ➕ Register New Patient
          </Typography>
          <PatientForm />

          <Divider sx={{ my: 4, borderStyle: 'dashed' }} />

          {/* Appointment Booking */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>
            📅 Schedule Appointment
          </Typography>
          <AppointmentForm />
        </Box>
      </TabPanel>

      {/* Tab 1: All Patients */}
      <TabPanel value={tabValue} index={1}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>
            👥 Patient Directory
          </Typography>
          <PatientList />
        </Box>
      </TabPanel>
    </Box>
  )
}
