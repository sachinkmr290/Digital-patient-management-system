import React, { useEffect, useState } from 'react'
import { Paper, Typography, Box, List, ListItem, ListItemText } from '@mui/material'
import api from '../api'
import dayjs from 'dayjs'

export default function CalendarView(){
  const [appts, setAppts] = useState([])

  useEffect(()=>{
    const fetch = async ()=>{
      try{
        const res = await api.get('/api/appointments')
        setAppts(res.data.items || [])
      }catch(e){ console.error(e) }
    }
    fetch()
  },[])

  const groups = {}
  appts.forEach(a=>{
    const d = a.date_time ? dayjs(a.date_time).format('YYYY-MM-DD') : 'Unknown'
    groups[d] = groups[d] || []
    groups[d].push(a)
  })

  const days = Object.keys(groups).sort()

  return (
    <Paper sx={{ p:2 }}>
      <Typography variant="h6">Upcoming Appointments</Typography>
      <List>
        {days.map(d=> (
          <Box key={d}>
            <Typography variant="subtitle2">{dayjs(d).format('DD MMM YYYY')}</Typography>
            {groups[d].map(a=> (<ListItem key={a._id}><ListItemText primary={`${a.patient_id} — ${dayjs(a.date_time).format('HH:mm')} — ${a.therapist||''}`} /></ListItem>))}
          </Box>
        ))}
      </List>
    </Paper>
  )
}
