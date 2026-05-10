import React, { useState } from 'react'
import {
  Box, Typography, Chip, TextField, Accordion, AccordionSummary,
  AccordionDetails, Divider, InputAdornment, IconButton
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ScienceIcon from '@mui/icons-material/Science'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CloseIcon from '@mui/icons-material/Close'

// ── Comprehensive blood test list for skin & hair specialists ──
export const BLOOD_TEST_CATEGORIES = [
  {
    category: 'Hormonal Profile',
    color: '#7c3aed',
    bg: '#f5f3ff',
    tests: [
      'TSH (Thyroid Stimulating Hormone)',
      'Free T3',
      'Free T4',
      'Thyroid Profile (T3, T4, TSH)',
      'Testosterone (Total)',
      'Testosterone (Free)',
      'DHT (Dihydrotestosterone)',
      'DHEA-S',
      'Prolactin',
      'LH (Luteinizing Hormone)',
      'FSH (Follicle Stimulating Hormone)',
      'Cortisol (Morning)',
      'Estradiol (E2)',
      'Progesterone',
      'Fasting Insulin',
      'HOMA-IR',
      'Androstenedione',
      'AMH (Anti-Müllerian Hormone)',
    ]
  },
  {
    category: 'Nutritional Deficiencies',
    color: '#d97706',
    bg: '#fffbeb',
    tests: [
      'Serum Ferritin',
      'Serum Iron',
      'TIBC (Total Iron Binding Capacity)',
      'Vitamin D (25-OH)',
      'Vitamin B12',
      'Folic Acid (Folate)',
      'Zinc (Serum)',
      'Copper (Serum)',
      'Biotin (Vitamin B7)',
      'Selenium',
      'Serum Calcium',
      'Magnesium',
      'Phosphorus',
    ]
  },
  {
    category: 'Complete Blood Count',
    color: '#dc2626',
    bg: '#fef2f2',
    tests: [
      'CBC (Complete Blood Count)',
      'Hemoglobin',
      'Hematocrit (PCV)',
      'ESR (Erythrocyte Sedimentation Rate)',
      'Peripheral Smear',
    ]
  },
  {
    category: 'Blood Sugar & Metabolic',
    color: '#0891b2',
    bg: '#f0fdfe',
    tests: [
      'Fasting Blood Sugar (FBS)',
      'Post-Prandial Blood Sugar (PPBS)',
      'HbA1c (Glycated Hemoglobin)',
      'Lipid Profile',
      'CRP (C-Reactive Protein)',
      'IL-6 (Interleukin-6)',
    ]
  },
  {
    category: 'Liver & Kidney',
    color: '#16a34a',
    bg: '#f0fdf4',
    tests: [
      'LFT (Liver Function Test)',
      'KFT (Kidney Function Test)',
      'SGOT (AST)',
      'SGPT (ALT)',
      'Serum Albumin',
      'Bilirubin (Total & Direct)',
    ]
  },
  {
    category: 'Autoimmune & Allergy',
    color: '#db2777',
    bg: '#fdf2f8',
    tests: [
      'ANA (Antinuclear Antibody)',
      'Anti-ds DNA',
      'IgE (Total)',
      'Specific IgE Panel',
      'ANCA',
      'Complement C3',
      'Complement C4',
      'RF (Rheumatoid Factor)',
    ]
  },
  {
    category: 'PCOS Panel',
    color: '#9333ea',
    bg: '#faf5ff',
    tests: [
      'PCOS Panel (LH, FSH, Testosterone, DHEA-S, Insulin)',
      'Fasting Insulin (PCOS)',
      'Androstenedione (PCOS)',
    ]
  },
]

export default function BloodTestSelector({ selectedTests = [], onTestsChange }) {
  const [customTest, setCustomTest] = useState('')

  const toggleTest = (test) => {
    if (selectedTests.includes(test)) {
      onTestsChange(selectedTests.filter(t => t !== test))
    } else {
      onTestsChange([...selectedTests, test])
    }
  }

  const addCustom = () => {
    const t = customTest.trim()
    if (!t || selectedTests.includes(t)) return
    onTestsChange([...selectedTests, t])
    setCustomTest('')
  }

  return (
    <Box>
      {/* Selected Tests */}
      {selectedTests.length > 0 && (
        <Box sx={{
          background: 'linear-gradient(135deg, #f8faff, #eff6ff)',
          border: '1.5px solid #bfdbfe',
          borderRadius: 2, p: 1.5, mb: 2,
        }}>
          <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
            🧪 Prescribed Tests ({selectedTests.length})
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.75}>
            {selectedTests.map((t, i) => (
              <Chip
                key={i}
                label={t}
                size="small"
                onDelete={() => toggleTest(t)}
                deleteIcon={<CloseIcon sx={{ fontSize: '14px !important' }} />}
                sx={{
                  background: '#1d4ed8',
                  color: '#fff',
                  fontWeight: 600,
                  '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.8)' },
                  '& .MuiChip-deleteIcon:hover': { color: '#fff' },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Category accordions */}
      <Box sx={{ mb: 2 }}>
        {BLOOD_TEST_CATEGORIES.map((cat) => {
          const selectedInCat = cat.tests.filter(t => selectedTests.includes(t)).length
          return (
            <Accordion key={cat.category} disableGutters elevation={0}
              sx={{
                border: '1px solid #e2e8f0', mb: 0.5, borderRadius: '8px !important',
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': { borderRadius: 2 },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ background: cat.bg, borderRadius: 2, minHeight: 44, '&.Mui-expanded': { minHeight: 44 } }}
              >
                <Box display="flex" alignItems="center" gap={1} width="100%">
                  <Typography variant="body2" sx={{ fontWeight: 700, color: cat.color, flex: 1 }}>
                    {cat.category}
                  </Typography>
                  {selectedInCat > 0 && (
                    <Chip
                      label={`${selectedInCat} selected`}
                      size="small"
                      sx={{ background: cat.color, color: '#fff', fontWeight: 700, fontSize: '0.7rem', height: 20 }}
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 1, pb: 1.5, px: 2 }}>
                <Box display="flex" flexWrap="wrap" gap={0.75}>
                  {cat.tests.map((test) => {
                    const isSelected = selectedTests.includes(test)
                    return (
                      <Chip
                        key={test}
                        label={test}
                        size="small"
                        clickable
                        onClick={() => toggleTest(test)}
                        variant={isSelected ? 'filled' : 'outlined'}
                        sx={{
                          borderColor: cat.color,
                          color: isSelected ? '#fff' : cat.color,
                          background: isSelected ? cat.color : 'transparent',
                          fontWeight: isSelected ? 700 : 400,
                          transition: 'all 0.15s',
                          '&:hover': { background: isSelected ? cat.color : cat.bg },
                        }}
                      />
                    )
                  })}
                </Box>
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Box>

      {/* Custom test input */}
      <TextField
        size="small"
        label="Add custom test"
        value={customTest}
        onChange={(e) => setCustomTest(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
        placeholder="Type test name and press Enter"
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={addCustom} disabled={!customTest.trim()} color="primary">
                <AddCircleOutlineIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />
    </Box>
  )
}
