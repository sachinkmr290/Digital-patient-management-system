import React, { useState, useEffect } from 'react'
import {
  Box, Paper, Typography, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert
} from '@mui/material'
import api from '../api'

export default function MedicinesSelector({ selectedMedicines, onMedicinesChange }) {
  const [medicines, setMedicines] = useState([])
  const [selectedMedicineId, setSelectedMedicineId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMedicines()
  }, [])

  const fetchMedicines = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/medicines')
      setMedicines(res.data.medicines || [])
    } catch (err) {
      setError('Failed to fetch medicines')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMedicine = () => {
    if (!selectedMedicineId) return

    const medicine = medicines.find(m => m._id === selectedMedicineId)
    if (!medicine) return

    // Check if already selected
    if (selectedMedicines.some(m => m._id === selectedMedicineId)) {
      setError('This medicine is already selected')
      return
    }

    onMedicinesChange([...selectedMedicines, medicine])
    setSelectedMedicineId('')
    setError('')
  }

  const handleRemoveMedicine = (medicineId) => {
    onMedicinesChange(selectedMedicines.filter(m => m._id !== medicineId))
  }

  const totalAmount = selectedMedicines.reduce((sum, m) => sum + m.price, 0)

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TextField
          select
          label="Search & add medicine"
          value={selectedMedicineId}
          onChange={(e) => setSelectedMedicineId(e.target.value)}
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderColor: '#3b82f6' } }}
          disabled={loading}
        >
          <MenuItem value="">Select a medicine</MenuItem>
          {medicines.map(m => (
            <MenuItem key={m._id} value={m._id}>
              {m.name} (₹{m.price.toFixed(2)})
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="body2" color="text.secondary">(select to add to bill)</Typography>
        <Button
          variant="contained"
          onClick={handleAddMedicine}
          disabled={!selectedMedicineId || loading}
          sx={{ ml: 1, display: selectedMedicineId ? 'block' : 'none' }}
        >
          Add
        </Button>
      </Box>

      {selectedMedicines.length > 0 && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#fcfcfc', borderRadius: 1, border: '1px solid #f0f0f0' }}>
          <Box display="flex" flexDirection="column" gap={1}>
            {selectedMedicines.map(m => (
              <Box key={m._id} display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <Button size="small" color="error" onClick={() => handleRemoveMedicine(m._id)} sx={{ minWidth: 'auto', p: 0, '&:hover': { background: 'transparent', color: '#d32f2f' } }}>✕</Button>
                  <Typography variant="body1" sx={{ color: '#334155' }}>{m.name} — ₹{m.price.toFixed(2)}</Typography>
                </Box>
              </Box>
            ))}
            
            <Box
              display="flex"
              justifyContent="space-between"
              sx={{
                borderTop: '1px dashed #cbd5e1',
                paddingTop: 1.5,
                marginTop: 1
              }}
            >
              <Typography variant="subtitle1" sx={{ color: '#475569' }}><strong>Total Bill</strong></Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 'bold',
                  color: '#1e293b',
                  fontSize: '1.1em'
                }}
              >
                ₹{totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}
