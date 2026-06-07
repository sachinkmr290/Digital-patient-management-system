export async function uploadCloudinaryMedia(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary not configured in frontend .env')
  }

  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', uploadPreset)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: fd,
  })
  const data = await res.json()

  if (!data.secure_url) {
    throw new Error(data.error?.message || 'Upload failed')
  }

  const resourceType = data.resource_type || (file.type?.startsWith('video/') ? 'video' : 'image')
  const url = resourceType === 'image'
    ? data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/')
    : data.secure_url

  return {
    url,
    resourceType,
    publicId: data.public_id,
  }
}
