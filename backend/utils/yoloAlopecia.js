const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const axios = require('axios')

function serviceBaseUrl() {
  const u = process.env.YOLO_ALOPECIA_URL || 'http://127.0.0.1:8000'
  return String(u).replace(/\/$/, '')
}

/**
 * Calls yolo_system FastAPI POST /predict with a local image file.
 */
async function predictAlopeciaFromFile(absImagePath, originalName = 'image.jpg') {
  const url = `${serviceBaseUrl()}/predict`
  const form = new FormData()
  form.append('file', fs.createReadStream(absImagePath), originalName || path.basename(absImagePath))
  const res = await axios.post(url, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 120000,
    validateStatus: () => true,
  })
  if (res.status >= 400) {
    const d = res.data && res.data.detail
    const msg =
      typeof d === 'string' ? d : d != null ? JSON.stringify(d) : res.statusText || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return res.data
}

/**
 * Persistable analysis (no raw base64). Annotated overlay saved under uploads/case-affected-ai/.
 */
function buildStorableAnalysis(raw, backendRoot, sourceBasename) {
  const analyzedAt = new Date().toISOString()
  const out = {
    status: raw.status,
    message: raw.message || '',
    reason: raw.reason || '',
    diagnosis: raw.diagnosis || '',
    detections: Array.isArray(raw.detections) ? raw.detections : [],
    analyzedAt,
  }
  if (raw.annotated_image && typeof raw.annotated_image === 'string') {
    const aiDir = path.join(backendRoot, 'uploads', 'case-affected-ai')
    if (!fs.existsSync(aiDir)) {
      fs.mkdirSync(aiDir, { recursive: true })
    }
    const base = path.basename(sourceBasename || 'img', path.extname(sourceBasename || ''))
    const annName = `annotated-${base}-${Date.now()}.png`
    const annAbs = path.join(aiDir, annName)
    fs.writeFileSync(annAbs, Buffer.from(raw.annotated_image, 'base64'))
    out.annotatedImagePath = path.relative(backendRoot, annAbs).replace(/\\/g, '/')
  }
  return out
}

async function processHairAffectedUpload(reqFile, backendRoot) {
  const raw = await predictAlopeciaFromFile(reqFile.path, reqFile.originalname || 'image.jpg')
  if (raw.status === 'rejected' || raw.status === 'error') {
    return { ok: false, raw }
  }
  return { ok: true }
}

function resolveUploadAbsPath(backendRoot, relFilePath) {
  const rel = String(relFilePath || '').trim().replace(/\\/g, '/').replace(/^\/+/, '')
  if (!rel || rel.includes('..')) return null
  const abs = path.resolve(backendRoot, rel)
  const root = path.resolve(backendRoot)
  const a = abs.toLowerCase()
  const r = root.toLowerCase()
  if (!a.startsWith(r + path.sep) && a !== r) return null
  return abs
}

/**
 * Merge server-side alopecia analysis into affected image entries (ignores any client-sent ai fields).
 * Always runs inference at submit for hair cases so DB stays in sync with files on disk (no sidecar mismatch).
 */
async function buildAffectedImagesWithHairAnalysis(aff, complaintType, backendRoot) {
  const out = []
  for (const f of aff) {
    const base = {
      filePath: f.filePath,
      originalName: f.originalName || '',
      complaintType: f.complaintType || complaintType,
    }
    if (complaintType !== 'hair') {
      out.push(base)
      continue
    }
    const abs = resolveUploadAbsPath(backendRoot, f.filePath)
    let aiAnalysis = null
    if (abs && fs.existsSync(abs)) {
      try {
        const raw = await predictAlopeciaFromFile(abs, f.originalName || path.basename(f.filePath))
        if (raw.status !== 'rejected' && raw.status !== 'error') {
          aiAnalysis = buildStorableAnalysis(raw, backendRoot, path.basename(f.filePath))
        }
      } catch (e) {
        console.error(
          '[Alopecia] inference on case submit failed:',
          e.message,
          '| file:',
          f.filePath,
          '| YOLO base URL:',
          serviceBaseUrl()
        )
      }
    } else {
      console.error('[Alopecia] affected image not on disk at submit:', f.filePath, 'resolved:', abs)
    }
    out.push(aiAnalysis ? { ...base, aiAnalysis } : base)
  }
  return out
}

module.exports = {
  predictAlopeciaFromFile,
  buildStorableAnalysis,
  serviceBaseUrl,
  processHairAffectedUpload,
  buildAffectedImagesWithHairAnalysis,
}
