/** Normalize API certification (legacy string or subdocument). */
export function getCertPath(cert) {
  if (cert == null) return ''
  return typeof cert === 'string' ? cert : cert.filePath || ''
}

export function getCertId(cert) {
  if (cert == null) return null
  if (typeof cert === 'string') return null
  const raw = cert._id ?? cert.id
  if (raw == null) return null
  return typeof raw === 'object' && typeof raw.toString === 'function' ? raw.toString() : String(raw)
}

export function getCertStatus(cert) {
  if (typeof cert === 'string') return 'pending'
  return cert.status || 'pending'
}
