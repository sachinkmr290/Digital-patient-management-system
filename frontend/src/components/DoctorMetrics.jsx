import React, { useState, useEffect } from 'react'
import { Box, Paper, Typography, Grid, Card, CardContent, CircularProgress, Alert } from '@mui/material'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../api'

export default function DoctorMetrics() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      // Fetch all patients to calculate metrics
      const pRes = await api.get('/api/patients?limit=1000')
      const patients = pRes.data.patients || []

      let totalPatients = patients.length
      let totalVisits = 0
      let totalRevenue = 0
      let treatmentBreakdown = {}
      let medicineRevenue = 0

      patients.forEach(patient => {
        const visits = patient.visits || []
        totalVisits += visits.length

        visits.forEach(visit => {
          // Count treatments
          if (visit.treatment) {
            treatmentBreakdown[visit.treatment] = (treatmentBreakdown[visit.treatment] || 0) + 1
          }

          // Calculate revenue from medicines
          if (visit.medicines && Array.isArray(visit.medicines)) {
            const visitMedicineRevenue = visit.medicines.reduce((sum, m) => sum + (m.price || 0), 0)
            medicineRevenue += visitMedicineRevenue
            totalRevenue += visitMedicineRevenue
          }
        })
      })

      // Convert treatment breakdown to chart data
      const treatmentData = Object.entries(treatmentBreakdown).map(([name, count]) => ({
        name,
        count,
        value: count
      }))

      const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

      setMetrics({
        totalPatients,
        totalVisits,
        totalRevenue: medicineRevenue,
        medicineRevenue,
        treatmentData,
        colors: COLORS,
        chartData: [
          { name: 'Patients', value: totalPatients },
          { name: 'Visits', value: totalVisits },
          { name: 'Revenue (₹)', value: Math.round(medicineRevenue) }
        ]
      })

      setError('')
    } catch (err) {
      setError('Failed to load metrics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!metrics) {
    return <Alert severity="info">No data available</Alert>
  }

  return (
    <Box>
      {/* Key Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#E3F2FD', border: '2px solid #2196F3' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Patients
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                {metrics.totalPatients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#F3E5F5', border: '2px solid #9C27B0' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Consultations
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9C27B0' }}>
                {metrics.totalVisits}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#E8F5E9', border: '2px solid #4CAF50' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Medicine Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                ₹{metrics.medicineRevenue.toFixed(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#FFF3E0', border: '2px solid #FF9800' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Revenue/Patient
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                ₹{metrics.totalPatients > 0 ? (metrics.medicineRevenue / metrics.totalPatients).toFixed(0) : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2}>
        {/* Treatment Breakdown */}
        {metrics.treatmentData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                📊 Treatment Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.treatmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {metrics.treatmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={metrics.colors[index % metrics.colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Summary Stats Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              📈 Practice Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2196F3" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Treatment List */}
      {metrics.treatmentData.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            🩺 Treatment Breakdown
          </Typography>
          <Box>
            {metrics.treatmentData.map((treatment, idx) => (
              <Box key={idx} display="flex" justifyContent="space-between" sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                <Typography>{treatment.name}</Typography>
                <Box display="flex" gap={2}>
                  <Typography sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                    {treatment.count} consultations
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  )
}
