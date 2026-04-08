function syncCertificationFlags(user) {
  const certs = user.certifications || []
  if (certs.length === 0) {
    user.isPendingVerification = false
    user.isDoctorVerified = false
    return
  }
  user.isPendingVerification = certs.some((c) => c.status === 'pending')
  user.isDoctorVerified = certs.some((c) => c.status === 'verified')
}

module.exports = { syncCertificationFlags }
