import React, { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Chip, Typography } from '@mui/material'
import api from '../api'

const TREATMENTS = [
  'Cupping',
  'PRP',
  'GFC',
  'Mesotherapy',
  'Biotin',
  'Other'
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

export default function VisitForm({ open, onClose, patientId, onCreated }) {
  const [visit, setVisit] = useState({ date_of_visit: '', doctor_notes: '', doctor_advice: '', treatment_type: '', photos: [] })
  const [uploading, setUploading] = useState(false)
  const [otherTreatmentDialogOpen, setOtherTreatmentDialogOpen] = useState(false)
  const [otherTreatment, setOtherTreatment] = useState('')

  const handleDateChange = (val) => {
    if (!val) return val;
    const d = new Date(val);
    const m = d.getMinutes();
    if (m !== 0 && m !== 30) {
      const snapped = m < 15 ? 0 : (m < 45 ? 30 : 0);
      d.setMinutes(snapped);
      if (snapped === 0 && m >= 45) d.setHours(d.getHours() + 1);
      const yyyy = d.getFullYear();
      const MM = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const HH = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${MM}-${dd}T${HH}:${min}`;
    }
    return val;
  }

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !uploadPreset) {
      alert('Cloudinary not configured')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', uploadPreset)
    setUploading(true)
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.secure_url) {
        setVisit((v) => ({ ...v, photos: [...v.photos, data.secure_url] }))
        alert('Photo uploaded successfully')
      } else {
        alert('Upload failed')
      }
    } catch (err) {
      console.error(err)
      alert('Upload error')
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    try {
      const payload = { visit }
      await api.put(`/api/patients/${patientId}`, payload)
      if (onCreated) onCreated()
      onClose()
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to add visit')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Add Visit</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField label="Date of Visit" type="datetime-local" value={visit.date_of_visit} onChange={(e)=>setVisit({...visit, date_of_visit: handleDateChange(e.target.value)})} InputLabelProps={{ shrink: true }} inputProps={{ step: 1800 }} />
          <TextField label="Doctor Notes" value={visit.doctor_notes} onChange={(e)=>setVisit({...visit, doctor_notes: e.target.value})} multiline rows={2} />
          
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick Advice Options:</Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
              {ADVICE_OPTIONS.map((adv, idx) => (
                <Chip 
                  key={idx} 
                  label={adv} 
                  onClick={() => setVisit({...visit, doctor_advice: visit.doctor_advice ? `${visit.doctor_advice}, ${adv}` : adv})} 
                  color="primary" 
                  variant="outlined" 
                  clickable
                  size="small"
                />
              ))}
            </Box>
            <TextField label="Doctor Advice" value={visit.doctor_advice} onChange={(e)=>setVisit({...visit, doctor_advice: e.target.value})} multiline rows={2} fullWidth />
          </Box>
          <Box>
            <TextField select label="Treatment Type" value={TREATMENTS.includes(visit.treatment_type) ? visit.treatment_type : (visit.treatment_type ? 'Other' : '')} onChange={(e) => {
              if (e.target.value === 'Other') {
                setOtherTreatmentDialogOpen(true)
              } else {
                setVisit({...visit, treatment_type: e.target.value})
              }
            }} fullWidth>
              <MenuItem value="">Select Treatment</MenuItem>
              {TREATMENTS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            {visit.treatment_type && !TREATMENTS.includes(visit.treatment_type) && (
              <Typography variant="caption" color="primary">Custom: {visit.treatment_type}</Typography>
            )}
          </Box>
          <input type="file" onChange={handleFile} />
          {visit.photos.map((u,i)=>(<img key={i} src={u} alt="p" style={{height:80, marginRight:8}}/>))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={submit} variant="contained" disabled={uploading}>Save</Button>
      </DialogActions>
      <Dialog open={otherTreatmentDialogOpen} onClose={() => setOtherTreatmentDialogOpen(false)}>
        <DialogTitle>Specify Custom Treatment</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Treatment Name" fullWidth value={otherTreatment} onChange={(e) => setOtherTreatment(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtherTreatmentDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            setVisit({ ...visit, treatment_type: otherTreatment })
            setOtherTreatmentDialogOpen(false)
          }} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}
