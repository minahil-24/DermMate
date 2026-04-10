import axios from 'axios'

/**
 * @returns {{ allowed: boolean, message?: string }}
 */
export async function fetchCanBookDoctor(apiUrl, token, doctorId, excludeCaseId) {
  const res = await axios.get(`${apiUrl}/api/cases/can-book/${doctorId}`, {
    headers: { Authorization: `Bearer ${token}` },
    params: excludeCaseId ? { excludeCaseId } : undefined,
  })
  return res.data
}
