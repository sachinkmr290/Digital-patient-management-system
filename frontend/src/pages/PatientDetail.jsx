import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Paper, Typography, Grid, Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Tabs, Tab, Alert, CircularProgress, Chip } from '@mui/material'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import api from '../api'
import dayjs from 'dayjs'
import { useAuth } from '../auth/AuthProvider'
import MedicinesSelector from '../components/MedicinesSelector'
import MedicinesPanel from '../components/MedicinesPanel'

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

function TabPanel(props) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  )
}

export default function PatientDetail() {
  const { patient_id } = useParams()
  const [patient, setPatient] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [tabValue, setTabValue] = useState(0)
  const [compare, setCompare] = useState({ a: null, b: null })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [newVisit, setNewVisit] = useState({ date_of_visit: '', doctor_notes: '', doctor_advice: '', treatment: '', photos: [] })
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [medicinesPanelOpen, setMedicinesPanelOpen] = useState(false)
  const [otherTreatmentDialogOpen, setOtherTreatmentDialogOpen] = useState(false)
  const [otherTreatment, setOtherTreatment] = useState('')
  const auth = useAuth()
  const nav = useNavigate()

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

  const fetch = async () => {
    try {
      const res = await api.get(`/api/patients/${patient_id}`)
      setPatient({
        ...res.data,
        medical_history: res.data.current_issues 
          ? (res.data.medical_history ? `${res.data.medical_history}\n\Current Issues: ${res.data.current_issues}` : `Current Issues: ${res.data.current_issues}`)
          : res.data.medical_history
      })
      setForm({ 
        full_name: res.data.full_name, 
        age: res.data.age, 
        gender: res.data.gender, 
        whatsapp: res.data.whatsapp, 
        medical_history: res.data.current_issues ? (res.data.medical_history ? `${res.data.medical_history}\n\nCurrent Issues: ${res.data.current_issues}` : res.data.current_issues) : res.data.medical_history,
        email: res.data.email 
      })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { fetch() }, [patient_id])

  const save = async () => {
    try {
      await api.put(`/api/patients/${patient_id}`, form)
      setEditing(false)
      fetch()
    } catch (e) { alert('Save failed') }
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
        setNewVisit((v) => ({ ...v, photos: [...v.photos, data.secure_url] }))
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

  const submitVisit = async () => {
    try {
      if (!newVisit.treatment) {
        alert('Please select a treatment')
        return
      }
      setSubmitting(true)
      const payload = { visit: { ...newVisit, medicines: selectedMedicines } }
      await api.put(`/api/patients/${patient_id}`, payload)
      setSuccessMessage('Visit added successfully! Confirmation sent to patient.')
      setNewVisit({ date_of_visit: '', doctor_notes: '', doctor_advice: '', treatment: '', photos: [] })
      setSelectedMedicines([])
      setTimeout(() => {
        fetch()
        setTabValue(0) // Redirect to History & Details tab
        setSuccessMessage('')
      }, 2000)
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to add visit')
    } finally {
      setSubmitting(false)
    }
  }

  const removePhotoFromNewVisit = (idx) => {
    setNewVisit(v => ({ ...v, photos: v.photos.filter((_, i) => i !== idx) }))
  }

  const remove = async () => {
    try {
      await api.delete(`/api/patients/${patient_id}`)
      nav('/')
    } catch (e) { alert('Delete failed') }
  }

  const exportPdf = async () => {
    window.print()
  }

  const visits = (patient && patient.visits) ? [...patient.visits].sort((a, b) => new Date(b.date_of_visit) - new Date(a.date_of_visit)) : []

  return (
    <div>
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Patient: {patient_id}</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={exportPdf} sx={{ mr: 1 }}>Export PDF</Button>
          {auth?.user?.role === 'Admin' && (
            <>
              <Button variant="contained" color="info" onClick={() => setMedicinesPanelOpen(true)}>Manage Medicines</Button>
              <Button color="error" onClick={() => setConfirmDelete(true)}>Delete</Button>
            </>
          )}
        </Box>
      </Box>

      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      <Paper>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="History & Details" />
          <Tab label="New Consultation" />
        </Tabs>

        {/* Tab 1: History & Details */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Details</Typography>
                {!editing ? (
                  <Box>
                    <Typography><strong>Name:</strong> {patient?.full_name}</Typography>
                    <Typography><strong>Age:</strong> {patient?.age || ''}</Typography>
                    <Typography><strong>Gender:</strong> {patient?.gender || ''}</Typography>
                    <Typography><strong>WhatsApp:</strong> {patient?.whatsapp || ''}</Typography>
                    <Typography><strong>Email:</strong> {patient?.email || ''}</Typography>
                    <Typography><strong>Next Visit:</strong> {patient?.next_visit ? dayjs(patient.next_visit).format('DD MMM YYYY, h:mm A') : ''}</Typography>
                    <Box mt={1}><Button onClick={() => setEditing(true)}>Edit</Button></Box>
                  </Box>
                ) : (
                  <Box display="flex" flexDirection="column" gap={1}>
                    <TextField label="Full name" value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                    <TextField label="Age" value={form.age || ''} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                    <TextField label="Gender" value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
                    <TextField label="WhatsApp" value={form.whatsapp || ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                    <TextField label="Email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>Common Conditions:</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                        {HISTORY_OPTIONS.map((hist, idx) => (
                          <Chip 
                            key={idx} 
                            label={hist} 
                            onClick={() => setForm({...form, medical_history: form.medical_history ? `${form.medical_history}, ${hist}` : hist})} 
                            color="secondary" 
                            variant="outlined" 
                            clickable
                            size="small"
                          />
                        ))}
                      </Box>
                      <TextField label="Complete Medical History & Current Issues" value={form.medical_history || ''} onChange={(e) => setForm({ ...form, medical_history: e.target.value })} multiline rows={3} fullWidth />
                    </Box>
                    <Box mt={1}>
                      <Button onClick={save} variant="contained" sx={{ mr: 1 }}>Save</Button>
                      <Button onClick={() => setEditing(false)}>Cancel</Button>
                    </Box>
                  </Box>
                )}
              </Paper>
              <Box mt={2}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">Previous Visits History</Typography>
                  <Box mt={1}>
                    {visits.length <= 1 ? (
                      <Typography variant="body2" sx={{ color: 'gray' }}>No previous visits recorded yet</Typography>
                    ) : (
                      visits.slice(0, visits.length - 1).map((v, idx) => (
                        <Box key={idx} sx={{ mb: 2, pb: 1, borderBottom: idx < visits.length - 2 ? '1px solid #eee' : 'none' }}>
                          <Typography><strong>{dayjs(v.date_of_visit).format('DD MMM YYYY, h:mm A')}</strong></Typography>
                          <Typography variant="body2" sx={{ color: 'primary.main' }}>{v.treatment}</Typography>
                          {v.doctor_notes && <Typography variant="body2"><strong>Notes:</strong> {v.doctor_notes}</Typography>}
                          {v.doctor_advice && <Typography variant="body2"><strong>Advice:</strong> {v.doctor_advice}</Typography>}
                          {v.next_visit && <Typography variant="body2" sx={{ color: 'orange' }}><strong>Next Scheduled:</strong> {dayjs(v.next_visit).format('DD MMM YYYY')}</Typography>}
                          {(v.photos || []).length > 0 && (
                            <Box mt={1}>
                              <Typography variant="caption"><strong>Photos:</strong></Typography>
                              <Box display="flex" gap={1} mt={0.5}>
                                {v.photos.map((u, i) => (<img key={i} src={u} alt="photo" style={{ height: 80, borderRadius: 4 }} />))}
                              </Box>
                            </Box>
                          )}
                          {(v.medicines || []).length > 0 && (
                            <Box mt={2} sx={{ backgroundColor: '#f9f9f9', p: 1.5, borderRadius: 1, border: '2px solid #2196F3' }}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2196F3' }}>💊 Medicines & Billing</Typography>
                              </Box>
                              <Box display="flex" flexDirection="column" gap={0.5}>
                                {v.medicines.map((m, i) => (
                                  <Box key={i} display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2">{m.name}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2196F3' }}>₹{m.price.toFixed(2)}</Typography>
                                  </Box>
                                ))}
                              </Box>
                              <Box display="flex" justifyContent="space-between" sx={{ borderTop: '2px solid #ddd', pt: 1, mt: 1 }}>
                                <Typography variant="subtitle2"><strong>Total Bill:</strong></Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '1.1em' }}>
                                  ₹{v.medicines.reduce((sum, m) => sum + m.price, 0).toFixed(2)}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      ))
                    )}
                  </Box>
                </Paper>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              {/* Visit History Timeline */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6">Visit History (Latest)</Typography>
                {visits.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'gray' }}>No visits recorded yet</Typography>
                ) : (
                  [visits[visits.length - 1]].map((v, idx) => (
                    <Box key={idx} sx={{ py: 2 }}>
                      <Typography><strong>{dayjs(v.date_of_visit).format('DD MMM YYYY, h:mm A')}</strong></Typography>
                      <Typography variant="body2" sx={{ color: 'primary.main' }}>{v.treatment}</Typography>
                      {v.doctor_notes && <Typography variant="body2"><strong>Notes:</strong> {v.doctor_notes}</Typography>}
                      {v.doctor_advice && <Typography variant="body2"><strong>Advice:</strong> {v.doctor_advice}</Typography>}
                      {v.next_visit && <Typography variant="body2" sx={{ color: 'orange' }}><strong>Next Scheduled:</strong> {dayjs(v.next_visit).format('DD MMM YYYY')}</Typography>}
                      {(v.photos || []).length > 0 && (
                        <Box mt={1}>
                          <Typography variant="caption"><strong>Photos:</strong></Typography>
                          <Box display="flex" gap={1} mt={0.5}>
                            {v.photos.map((u, i) => (<img key={i} src={u} alt="photo" style={{ height: 80, borderRadius: 4 }} />))}
                          </Box>
                        </Box>
                      )}
                      {(v.medicines || []).length > 0 && (
                        <Box mt={2} sx={{ backgroundColor: '#f9f9f9', p: 1.5, borderRadius: 1, border: '2px solid #2196F3' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2196F3' }}>💊 Medicines & Billing</Typography>
                          </Box>
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            {v.medicines.map((m, i) => (
                              <Box key={i} display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2">{m.name}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2196F3' }}>₹{m.price.toFixed(2)}</Typography>
                              </Box>
                            ))}
                          </Box>
                          <Box display="flex" justifyContent="space-between" sx={{ borderTop: '2px solid #ddd', pt: 1, mt: 1 }}>
                            <Typography variant="subtitle2"><strong>Total Bill:</strong></Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '1.1em' }}>
                              ₹{v.medicines.reduce((sum, m) => sum + m.price, 0).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ))
                )}
              </Paper>

              {/* Before/After Comparison */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Before / After Comparison</Typography>
                <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>Select two visits to compare first photos</Typography>
                <Box display="flex" gap={1} mb={2}>
                  <TextField select label="Visit A" value={compare.a !== null ? compare.a : ''} onChange={(e) => setCompare(c => ({ ...c, a: e.target.value }))} size="small" sx={{ flex: 1 }}>
                    <MenuItem value="">Select</MenuItem>
                    {visits.map((v, i) => (<MenuItem key={i} value={i}>{dayjs(v.date_of_visit).format('DD MMM')} - {v.treatment}</MenuItem>))}
                  </TextField>
                  <TextField select label="Visit B" value={compare.b !== null ? compare.b : ''} onChange={(e) => setCompare(c => ({ ...c, b: e.target.value }))} size="small" sx={{ flex: 1 }}>
                    <MenuItem value="">Select</MenuItem>
                    {visits.map((v, i) => (<MenuItem key={i} value={i}>{dayjs(v.date_of_visit).format('DD MMM')} - {v.treatment}</MenuItem>))}
                  </TextField>
                </Box>
                <CompareImages visits={visits} a={compare.a} b={compare.b} />
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: New Consultation */}
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Add New Consultation for {patient?.full_name}</Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField label="Date of Visit" type="datetime-local" value={newVisit.date_of_visit} onChange={(e) => setNewVisit({ ...newVisit, date_of_visit: handleDateChange(e.target.value) })} InputLabelProps={{ shrink: true }} inputProps={{ step: 1800 }} fullWidth sx={{ mb: 2 }} />
              <Box mb={2}>
                <TextField select label="Treatment Type" value={TREATMENTS.includes(newVisit.treatment) ? newVisit.treatment : (newVisit.treatment ? 'Other' : '')} onChange={(e) => {
                  if (e.target.value === 'Other') {
                    setOtherTreatmentDialogOpen(true)
                  } else {
                    setNewVisit({ ...newVisit, treatment: e.target.value })
                  }
                }} fullWidth>
                  <MenuItem value="">Select Treatment</MenuItem>
                  {TREATMENTS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                {newVisit.treatment && !TREATMENTS.includes(newVisit.treatment) && (
                  <Typography variant="caption" color="primary">Custom: {newVisit.treatment}</Typography>
                )}
              </Box>
              <TextField label="Doctor Notes" value={newVisit.doctor_notes} onChange={(e) => setNewVisit({ ...newVisit, doctor_notes: e.target.value })} multiline rows={2} fullWidth sx={{ mb: 2 }} />
              
              <Box>
                <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                  {ADVICE_OPTIONS.map((adv, idx) => (
                    <Chip 
                      key={idx} 
                      label={adv} 
                      onClick={() => setNewVisit({...newVisit, doctor_advice: newVisit.doctor_advice ? `${newVisit.doctor_advice}, ${adv}` : adv})} 
                      color="primary" 
                      variant="outlined" 
                      clickable
                      size="small"
                    />
                  ))}
                </Box>
                <TextField label="Doctor Advice" value={newVisit.doctor_advice} onChange={(e) => setNewVisit({ ...newVisit, doctor_advice: e.target.value })} multiline rows={2} fullWidth sx={{ mb: 2 }} />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Button variant="outlined" component="label" startIcon={<CameraAltIcon />} disabled={uploading}>
                  UPLOAD PHOTO
                  <input type="file" hidden onChange={handleFile} />
                </Button>
                {uploading && <CircularProgress size={20} sx={{ ml: 1 }} />}
              </Box>


              {newVisit.photos.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Uploaded Photos:</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {newVisit.photos.map((u, i) => (
                      <Box key={i} sx={{ position: 'relative' }}>
                        <img src={u} alt={`photo-${i}`} style={{ height: 100, borderRadius: 4, border: '1px solid #ccc' }} />
                        <Button size="small" color="error" onClick={() => removePhotoFromNewVisit(i)} sx={{ position: 'absolute', top: -8, right: -8, minWidth: 'auto', width: 24, height: 24 }}>✕</Button>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              <Box mt={3} pt={2} sx={{ borderTop: '1px solid #f0f0f0' }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <MedicalServicesIcon sx={{ color: '#1d4ed8' }} />
                  <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 'bold' }}>Medicines & Billing</Typography>
                </Box>
                <MedicinesSelector selectedMedicines={selectedMedicines} onMedicinesChange={setSelectedMedicines} />
              </Box>

              <Box display="flex" gap={1} mt={2}>
                <Button variant="contained" onClick={submitVisit} disabled={submitting || !newVisit.treatment}>
                  {submitting ? 'Saving...' : 'Save Consultation'}
                </Button>
                <Button variant="outlined" onClick={() => { setNewVisit({ date_of_visit: '', doctor_notes: '', doctor_advice: '', treatment: '', photos: [] }); setSelectedMedicines([]) }}>Reset</Button>
              </Box>
            </Box>
          </Paper>
        </TabPanel>
      </Paper>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete this patient? This action cannot be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color="error" onClick={remove}>Delete</Button>
        </DialogActions>
      </Dialog>

      <MedicinesPanel open={medicinesPanelOpen} onClose={() => setMedicinesPanelOpen(false)} />

      <Dialog open={otherTreatmentDialogOpen} onClose={() => setOtherTreatmentDialogOpen(false)}>
        <DialogTitle>Specify Custom Treatment</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Treatment Name" fullWidth value={otherTreatment} onChange={(e) => setOtherTreatment(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtherTreatmentDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            setNewVisit({ ...newVisit, treatment: otherTreatment })
            setOtherTreatmentDialogOpen(false)
          }} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

function CompareImages({ visits, a, b }) {
  if (a === '' || b === '' || a == null || b == null) return null
  const va = visits[parseInt(a)]
  const vb = visits[parseInt(b)]
  const ima = va && va.photos && va.photos[0]
  const imb = vb && vb.photos && vb.photos[0]
  if (!ima || !imb) return <Typography variant="body2" sx={{ color: 'gray' }}>No photos available for selected visits</Typography>
  return (
    <Box mt={2} display="flex" gap={2}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption"><strong>Visit A: {dayjs(va.date_of_visit).format('DD MMM YYYY')}</strong></Typography>
        <img src={ima} alt="a" style={{ width: '100%', borderRadius: 4, border: '2px solid primary' }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption"><strong>Visit B: {dayjs(vb.date_of_visit).format('DD MMM YYYY')}</strong></Typography>
        <img src={imb} alt="b" style={{ width: '100%', borderRadius: 4 }} />
      </Box>
    </Box>
  )
}


