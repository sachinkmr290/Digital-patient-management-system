import React, { useState } from 'react'
import {
  Paper, TextField, Button, MenuItem, Box, Grid, Divider, Typography, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import api from '../api'
import MedicinesSelector from './MedicinesSelector'
import { useNavigate } from 'react-router-dom'

const genders = [
  { value: 'Male' },
  { value: 'Female' },
  { value: 'Other' }
]

const ADVICE_OPTIONS = [
  'use RO water for head wash',
  'eat Diet',
  'head stand',
  'avoid junk food',
  'ensure good sleep',
  'use sulfate-free shampoo',
  'manage stress',
  'increase protein intake'
]

const HISTORY_OPTIONS = [
  'Alopecia Areata',
  'PCOS',
  'Thyroid Disorder',
  'Telogen Effluvium',
  'Nutritional Deficiencies (Iron/Biotin/Zinc)',
  'Family History of Hair Loss',
  'Androgenetic Alopecia',
  'Traction Alopecia',
  'Dandruff / Seborrheic Dermatitis',
  'Scalp Psoriasis'
]

const treatments = [
  'Cupping',
  'GFC (Growth Factor Concentrate)',
  'PRP (Platelet Rich Plasma)',
  'PRP with Biotin',
  'Mesotherapy',
  'Massage',
  'Other'
]

const EMPTY_FORM = {
  full_name: '',
  age: '',
  gender: '',
  whatsapp: '',
  email: '',
  medical_history: '',
  current_issues: '',
  doctor_notes: '',
  doctor_advice: '',
  treatment: ''
}

export default function PatientForm() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [photos, setPhotos] = useState([])
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [loading, setLoading] = useState(false)
  const [otherTreatmentDialogOpen, setOtherTreatmentDialogOpen] = useState(false)
  const [otherTreatment, setOtherTreatment] = useState('')

  // Success dialog state
  const [successDialog, setSuccessDialog] = useState({ open: false, patientId: null, name: '' })
  // Duplicate-patient dialog state
  const [dupDialog, setDupDialog] = useState({ open: false, patientId: null, name: '' })

  const navigate = useNavigate()

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !uploadPreset) {
      alert('Cloudinary not configured in frontend .env')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', uploadPreset)
    setLoading(true)
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.secure_url) {
        setPhotos((p) => [...p, data.secure_url])
        alert('Photo uploaded successfully')
      } else {
        alert('Upload failed')
      }
    } catch (err) {
      console.error(err)
      alert('Upload error')
    } finally {
      setLoading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.whatsapp || !form.age || !form.gender || !form.treatment) {
      alert('Full name, WhatsApp, Age, Gender and Treatment are required fields.')
      return
    }
    try {
      const payload = { ...form, photos, medicines: selectedMedicines }
      const res = await api.post('/api/patients', payload)
      setSuccessDialog({ open: true, patientId: res.data.patient_id, name: form.full_name })
      setForm(EMPTY_FORM)
      setPhotos([])
      setSelectedMedicines([])
    } catch (err) {
      const data = err.response?.data
      // Duplicate patient — show friendly dialog
      if (err.response?.status === 409 && data?.duplicate) {
        setDupDialog({ open: true, patientId: data.patient_id, name: form.full_name })
        return
      }
      alert(data?.msg || 'Create failed: ' + err.message)
    }
  }

  const handleGoToPatient = () => {
    setDupDialog({ open: false, patientId: null, name: '' })
    navigate(`/patients/${dupDialog.patientId}`)
  }

  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>Create New Patient</Typography>
        <form onSubmit={submit}>

          {/* Basic Information */}
          <Typography variant="h6" mt={2} mb={1}>Basic Information</Typography>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Full Name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="WhatsApp Number *" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} required fullWidth placeholder="+919876543210" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth type="email" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Age *" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} fullWidth type="number" required inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField select label="Gender *" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} fullWidth required>
                <MenuItem value="">Select</MenuItem>
                {genders.map(g => <MenuItem key={g.value} value={g.value}>{g.value}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Medical Information */}
          <Typography variant="h6" mt={2} mb={1}>Medical History</Typography>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Common Conditions:</Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                {HISTORY_OPTIONS.map((hist, idx) => (
                  <Chip
                    key={idx}
                    label={hist}
                    onClick={() => setForm({ ...form, medical_history: form.medical_history ? `${form.medical_history}, ${hist}` : hist })}
                    color="secondary"
                    variant="outlined"
                    clickable
                    size="small"
                  />
                ))}
              </Box>
              <TextField label="Complete Medical History & Current Issues" value={form.medical_history} onChange={(e) => setForm({ ...form, medical_history: e.target.value })} fullWidth multiline rows={4} placeholder="Past illnesses, allergies, medications, and current symptoms..." />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Visit Information */}
          <Typography variant="h6" mt={2} mb={1}>Visit Details</Typography>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6}>
              <TextField select label="Treatment Type *" value={treatments.includes(form.treatment) ? form.treatment : (form.treatment ? 'Other' : '')} onChange={(e) => {
                if (e.target.value === 'Other') {
                  setOtherTreatmentDialogOpen(true)
                } else {
                  setForm({ ...form, treatment: e.target.value })
                }
              }} fullWidth required>
                <MenuItem value="">Select treatment</MenuItem>
                {treatments.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              {form.treatment && !treatments.includes(form.treatment) && (
                <Typography variant="caption" color="primary">Custom: {form.treatment}</Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Doctor's Notes" value={form.doctor_notes} onChange={(e) => setForm({ ...form, doctor_notes: e.target.value })} fullWidth multiline rows={2} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick Advice Options:</Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                {ADVICE_OPTIONS.map((adv, idx) => (
                  <Chip
                    key={idx}
                    label={adv}
                    onClick={() => setForm({ ...form, doctor_advice: form.doctor_advice ? `${form.doctor_advice}, ${adv}` : adv })}
                    color="primary"
                    variant="outlined"
                    clickable
                  />
                ))}
              </Box>
              <TextField label="Doctor's Advice" value={form.doctor_advice} onChange={(e) => setForm({ ...form, doctor_advice: e.target.value })} fullWidth multiline rows={2} placeholder="e.g., Head wash by RO water, Derma roller, advised diet and yoga" />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Photos */}
          <Typography variant="h6" mt={2} mb={1}>Photos</Typography>
          <Box mb={2}>
            {photos.length > 0 && (
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                {photos.map((p, i) => (
                  <Box key={i} sx={{ width: 80, height: 80, backgroundImage: `url(${p})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 1 }} />
                ))}
              </Box>
            )}
            <Button variant="contained" component="label" disabled={loading} sx={{ mb: 2 }}>
              Upload Photo
              <input hidden type="file" onChange={handleFile} accept="image/*" />
            </Button>
          </Box>

          <Box mt={3} pt={2} sx={{ borderTop: '1px solid #f0f0f0' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <MedicalServicesIcon sx={{ color: '#1d4ed8' }} />
              <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 'bold' }}>Medicines & Billing</Typography>
            </Box>
            <MedicinesSelector selectedMedicines={selectedMedicines} onMedicinesChange={setSelectedMedicines} />
          </Box>

          {/* Submit */}
          <Box display="flex" gap={1} mt={3}>
            <Button type="submit" variant="contained" color="primary" size="large">Create Patient</Button>
          </Box>
        </form>
      </Paper>

      {/* ── Duplicate Patient Dialog ── */}
      <Dialog
        open={dupDialog.open}
        onClose={() => setDupDialog({ open: false, patientId: null, name: '' })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <PersonSearchIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Patient Already Registered</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>Record found in the system</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Alert
            severity="info"
            icon={false}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
              border: '1px solid #bfdbfe',
              mb: 2
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e40af', mb: 0.5 }}>
              This patient is already in our records.
            </Typography>
            <Typography variant="body2" sx={{ color: '#1d4ed8' }}>
              Please visit the patient's details page to log the new visit.
            </Typography>
          </Alert>

          {dupDialog.patientId && (
            <Box sx={{ background: '#f8fafc', borderRadius: 2, p: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                Existing Record
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
                {dupDialog.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6366F1', fontFamily: 'monospace', mt: 0.25 }}>
                ID: {dupDialog.patientId}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setDupDialog({ open: false, patientId: null, name: '' })}
            sx={{ borderRadius: 2 }}
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            onClick={handleGoToPatient}
            endIcon={<ArrowForwardIcon />}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6366F1 0%, #4f46e5 100%)',
              fontWeight: 700,
              '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }
            }}
          >
            Go to Patient Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Patient Added Successfully Dialog ── */}
      <Dialog
        open={successDialog.open}
        onClose={() => setSuccessDialog({ open: false, patientId: null, name: '' })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '14px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 14px rgba(34,197,94,0.4)'
          }}>
            <CheckCircleIcon sx={{ color: '#fff', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#0f172a' }}>
              Patient Added Successfully!
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Record has been saved to the system
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Alert
            severity="success"
            icon={false}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #bbf7d0',
              mb: 2,
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#166534', mb: 0.5 }}>
              This patient has been added successfully.
            </Typography>
            <Typography variant="body2" sx={{ color: '#15803d' }}>
              You can now schedule appointments or log future visits from the patient's detail page.
            </Typography>
          </Alert>

          {successDialog.patientId && (
            <Box sx={{ background: '#f8fafc', borderRadius: 2, p: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                New Patient Record
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
                {successDialog.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6366F1', fontFamily: 'monospace', mt: 0.25 }}>
                Patient ID: {successDialog.patientId}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setSuccessDialog({ open: false, patientId: null, name: '' })}
            sx={{ borderRadius: 2 }}
          >
            Add Another Patient
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => {
              setSuccessDialog({ open: false, patientId: null, name: '' })
              navigate(`/patients/${successDialog.patientId}`)
            }}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              fontWeight: 700,
              '&:hover': { background: 'linear-gradient(135deg, #16a34a 0%, #166534 100%)' },
              boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
            }}
          >
            View Patient Record
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={otherTreatmentDialogOpen} onClose={() => setOtherTreatmentDialogOpen(false)}>
        <DialogTitle>Specify Custom Treatment</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Treatment Name" fullWidth value={otherTreatment} onChange={(e) => setOtherTreatment(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtherTreatmentDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            setForm({ ...form, treatment: otherTreatment })
            setOtherTreatmentDialogOpen(false)
          }} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
