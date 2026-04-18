/**
 * Remove doctor-only AI fields from case payloads sent to patients.
 */
function stripAffectedAiForPatient(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const c = { ...obj }
  if (Array.isArray(c.affectedImages)) {
    c.affectedImages = c.affectedImages.map((img) => {
      if (!img || typeof img !== 'object') return img
      const { aiAnalysis: _a, ...rest } = img
      return rest
    })
  }
  return c
}

function stripAffectedAiForPatientList(list) {
  if (!Array.isArray(list)) return list
  return list.map((item) => stripAffectedAiForPatient(item))
}

module.exports = { stripAffectedAiForPatient, stripAffectedAiForPatientList }
