import React, { useEffect, useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableRow, Paper,
  Button, TextField, Box, CircularProgress, Chip
} from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PendingIcon from '@mui/icons-material/Pending'
import { Link } from 'react-router-dom'
import api from '../api'

export default function PatientList({ patientType = 'offline' }) {
  const [patients, setPatients] = useState([])
  const [query, setQuery] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [patientId, setPatientId] = useState('')
  const [loading, setLoading] = useState(false)
  const isOnline = patientType === 'online'

  const fetchPatients = async () => {
    const params = { patient_type: patientType }
    if (query) params.name = query
    if (whatsapp) params.whatsapp = whatsapp
    if (patientId) params.patient_id = patientId
    setLoading(true)
    try {
      const res = await api.get('/api/patients', { params })
      setPatients(res.data.items || [])
    } catch (err) {
      console.error('Error fetching patients:', err)
      alert('Failed to fetch patients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPatients() }, [patientType])

  const getTreatment = (patient) =>
    (patient.visits && patient.visits[0] && patient.visits[0].treatment) || 'N/A'

  const getLatestVisit = (patient) =>
    patient.visits && patient.visits.length > 0
      ? patient.visits[patient.visits.length - 1]
      : null

  const getDispatchStatus = (patient) => {
    const v = getLatestVisit(patient)
    if (!v) return null
    return v.tracking_id ? 'dispatched' : 'pending'
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box mb={2} display="flex" gap={1} flexWrap="wrap">
        <TextField placeholder="Search by name" value={query} onChange={(e) => setQuery(e.target.value)} size="small" />
        <TextField placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} size="small" sx={{ width: 160 }} />
        <TextField placeholder="Patient ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} size="small" sx={{ width: 160 }} />
        <Button variant="contained" onClick={fetchPatients} disabled={loading}
          sx={{ background: isOnline ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : undefined }}>
          Search
        </Button>
        {loading && <CircularProgress size={30} />}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: isOnline ? '#f0fdfe' : '#f5f5f5' }}>
              <TableCell><strong>Patient ID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>WhatsApp</strong></TableCell>
              <TableCell><strong>Age</strong></TableCell>
              <TableCell><strong>Gender</strong></TableCell>
              <TableCell><strong>Treatment</strong></TableCell>
              {isOnline && <TableCell><strong>Amount Paid</strong></TableCell>}
              {isOnline && <TableCell><strong>Dispatch</strong></TableCell>}
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map(p => {
              const latestVisit = getLatestVisit(p)
              const dispatchStatus = getDispatchStatus(p)
              return (
                <TableRow key={p.patient_id} hover>
                  <TableCell><strong>{p.patient_id}</strong></TableCell>
                  <TableCell>{p.full_name}</TableCell>
                  <TableCell>{p.whatsapp}</TableCell>
                  <TableCell>{p.age || '-'}</TableCell>
                  <TableCell>{p.gender || '-'}</TableCell>
                  <TableCell>{getTreatment(p)}</TableCell>
                  {isOnline && (
                    <TableCell>
                      {latestVisit?.amount_paid
                        ? <strong>₹{latestVisit.amount_paid}</strong>
                        : <span style={{ color: '#94a3b8' }}>—</span>}
                    </TableCell>
                  )}
                  {isOnline && (
                    <TableCell>
                      {dispatchStatus === 'dispatched' ? (
                        <Chip
                          icon={<LocalShippingIcon />}
                          label="Dispatched"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          icon={<PendingIcon />}
                          label="Pending"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => navigator.clipboard.writeText(p.patient_id)}>Copy ID</Button>
                    <Button size="small" variant="outlined" component={Link} to={`/patients/${p.patient_id}`} sx={{ ml: 1 }}>View</Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {!loading && patients.length === 0 && (
        <Box p={3} textAlign="center">No {isOnline ? 'online' : 'offline'} patients found</Box>
      )}
    </Paper>
  )
}
