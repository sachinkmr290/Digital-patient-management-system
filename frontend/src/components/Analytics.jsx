import React, { useEffect, useState } from 'react'
import { Paper, Typography, Grid, Box } from '@mui/material'
import api from '../api'

export default function Analytics(){
  const [stats, setStats] = useState(null)

  useEffect(()=>{
    const fetch = async ()=>{
      try{
        const res = await api.get('/api/patients', { params: { per_page: 1000 } })
        const items = res.data.items || []
        const total = items.length
        const genders = items.reduce((acc,i)=>{ const g = i.gender || 'Unknown'; acc[g]=(acc[g]||0)+1; return acc }, {})
        const treatments = {}
        items.forEach(p=>{
          const t = (p.visits && p.visits[0] && p.visits[0].treatment_type) || 'Unknown'
          treatments[t] = (treatments[t]||0)+1
        })
        setStats({ total, genders, treatments })
      }catch(e){ console.error(e) }
    }
    fetch()
  },[])

  if (!stats) return <Typography>Loading analytics...</Typography>

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p:2 }}>
          <Typography variant="h6">Totals</Typography>
          <Typography>Total patients: {stats.total}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p:2 }}>
          <Typography variant="h6">By Gender</Typography>
          {Object.entries(stats.genders).map(([k,v])=>(<Typography key={k}>{k}: {v}</Typography>))}
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p:2 }}>
          <Typography variant="h6">Top Treatments</Typography>
          {Object.entries(stats.treatments).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>(<Typography key={k}>{k}: {v}</Typography>))}
        </Paper>
      </Grid>
    </Grid>
  )
}
