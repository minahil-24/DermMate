const path = require('path')
const fs = require('fs')

const backendRoot = path.join(__dirname, '..')

/**
 * Resolve a path stored from multer (often relative to process.cwd() when the server started).
 */
function resolveStoredUploadPath(filePath) {
  if (!filePath) return null
  const normalized = filePath.replace(/\\/g, path.sep)
  if (path.isAbsolute(normalized) && fs.existsSync(normalized)) {
    return normalized
  }
  const fromBackendRoot = path.join(backendRoot, normalized)
  if (fs.existsSync(fromBackendRoot)) {
    return fromBackendRoot
  }
  const fromCwd = path.resolve(process.cwd(), normalized)
  if (fs.existsSync(fromCwd)) {
    return fromCwd
  }
  return fromBackendRoot
}

function unlinkStoredFile(filePath) {
  const abs = resolveStoredUploadPath(filePath)
  if (!abs) return false
  try {
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs)
      return true
    }
  } catch (e) {
    console.error('unlinkStoredFile:', abs, e.message)
  }
  return false
}

module.exports = { backendRoot, resolveStoredUploadPath, unlinkStoredFile }
