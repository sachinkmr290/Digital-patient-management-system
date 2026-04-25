import React, { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, Button, TextField, Box, MenuItem, CircularProgress } from '@mui/material'
import { Link } from 'react-router-dom'
import api from '../api'

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [query, setQuery] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [patientId, setPatientId] = useState('')
  const [loading, setLoading] = useState(false)

  const fetch = async () => {
    const params = {}
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

  useEffect(() => { fetch() }, [])

  const getTreatment = (patient) => {
    return (patient.visits && patient.visits[0] && patient.visits[0].treatment) || 'N/A'
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box mb={2} display="flex" gap={1} flexWrap="wrap">
        <TextField placeholder="Search by name" value={query} onChange={(e)=>setQuery(e.target.value)} size="small" />
        <TextField placeholder="WhatsApp" value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} size="small" sx={{ width: 160 }} />
        <TextField placeholder="Patient ID" value={patientId} onChange={(e)=>setPatientId(e.target.value)} size="small" sx={{ width: 160 }} />
        <Button variant="contained" onClick={fetch} disabled={loading}>Search</Button>
        {loading && <CircularProgress size={30} />}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Patient ID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>WhatsApp</strong></TableCell>
              <TableCell><strong>Age</strong></TableCell>
              <TableCell><strong>Gender</strong></TableCell>
              <TableCell><strong>Treatment</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map(p => (
              <TableRow key={p.patient_id} hover>
                <TableCell><strong>{p.patient_id}</strong></TableCell>
                <TableCell>{p.full_name}</TableCell>
                <TableCell>{p.whatsapp}</TableCell>
                <TableCell>{p.age || '-'}</TableCell>
                <TableCell>{p.gender || '-'}</TableCell>
                <TableCell>{getTreatment(p)}</TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={()=>navigator.clipboard.writeText(p.patient_id)}>Copy ID</Button>
                  <Button size="small" variant="outlined" component={Link} to={`/patients/${p.patient_id}`} sx={{ ml: 1 }}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!loading && patients.length === 0 && (
        <Box p={3} textAlign="center">No patients found</Box>
      )}
    </Paper>
  )
}
