import React, { useState, useEffect } from 'react'
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, 
  MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Box, Typography, Alert
} from '@mui/material'
import api from '../api'

export default function MedicinesPanel({ open, onClose, onUpdated }) {
  const [medicines, setMedicines] = useState([])
  const [openForm, setOpenForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', description: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (open) {
      fetchMedicines()
    }
  }, [open])

  const fetchMedicines = async () => {
    try {
      const res = await api.get('/api/medicines')
      setMedicines(res.data.medicines || [])
    } catch (err) {
      setError('Failed to fetch medicines')
    }
  }

  const handleAdd = () => {
    setForm({ name: '', price: '', description: '' })
    setEditingId(null)
    setOpenForm(true)
    setError('')
  }

  const handleEdit = (medicine) => {
    setForm({ name: medicine.name, price: medicine.price, description: medicine.description })
    setEditingId(medicine._id)
    setOpenForm(true)
    setError('')
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      setError('Name and price are required')
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        await api.put(`/api/medicines/${editingId}`, {
          name: form.name,
          price: parseFloat(form.price),
          description: form.description
        })
        setSuccess('Medicine updated successfully')
      } else {
        await api.post('/api/medicines', {
          name: form.name,
          price: parseFloat(form.price),
          description: form.description
        })
        setSuccess('Medicine added successfully')
      }
      setOpenForm(false)
      fetchMedicines()
      if (onUpdated) onUpdated()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save medicine')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return

    setLoading(true)
    try {
      await api.delete(`/api/medicines/${id}`)
      setSuccess('Medicine deleted successfully')
      fetchMedicines()
      if (onUpdated) onUpdated()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete medicine')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Manage Medicines</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ mb: 2, mt: 2 }}>
          <Button variant="contained" onClick={handleAdd}>Add New Medicine</Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Medicine Name</strong></TableCell>
                <TableCell align="right"><strong>Price (₹)</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medicines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No medicines found</TableCell>
                </TableRow>
              ) : (
                medicines.map(m => (
                  <TableRow key={m._id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell align="right">₹{m.price.toFixed(2)}</TableCell>
                    <TableCell>{m.description || '-'}</TableCell>
                    <TableCell align="center">
                      <Button size="small" onClick={() => handleEdit(m)} sx={{ mr: 1 }}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleDelete(m._id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      {/* Add/Edit Form Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)}>
        <DialogTitle>{editingId ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Medicine Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              autoFocus
            />
            <TextField
              label="Price (₹)"
              type="number"
              inputProps={{ step: 0.01, min: 0 }}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}
