import React, { useEffect, useState } from 'react'
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Typography } from '@mui/material'
import api from '../api'

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([])

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/api/appointments')
      setAppointments(res.data.items || [])
    } catch (e) {
      console.error('fetch appts', e)
    }
  }

  useEffect(() => { fetchAppointments() }, [])

  const sendReminder = async (id) => {
    try {
      await api.post(`/api/appointments/${id}/send_reminder`, {})
      alert('Reminder sent')
      fetchAppointments()
    } catch (err) {
      alert('Failed to send reminder')
    }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" mb={1}>Appointments</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Patient ID</TableCell>
            <TableCell>Date/Time</TableCell>
            <TableCell>Therapist</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {appointments.map(a => (
            <TableRow key={a._id}>
              <TableCell>{a._id}</TableCell>
              <TableCell>{a.patient_id}</TableCell>
              <TableCell>{a.date_time}</TableCell>
              <TableCell>{a.therapist || ''}</TableCell>
              <TableCell>{a.status || ''}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => sendReminder(a._id)}>Send Reminder</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
