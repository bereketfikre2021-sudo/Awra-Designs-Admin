/**
 * Compress an image File using the Canvas API before uploading.
 * Reduces file size while keeping reasonable quality.
 *
 * @param {File} file          Original image file
 * @param {object} opts
 * @param {number} opts.maxWidth   Max width in px (default 1920)
 * @param {number} opts.maxHeight  Max height in px (default 1920)
 * @param {number} opts.quality    JPEG/WEBP quality 0–1 (default 0.82)
 * @returns {Promise<File>}    Compressed file (same name, image/webp)
 */
export async function compressImage(file, {
  maxWidth  = 1920,
  maxHeight = 1920,
  quality   = 0.82,
} = {}) {
  // SVGs and GIFs pass through unchanged
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Scale down if needed, preserve aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width  = Math.round(width  * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        blob => {
          if (!blob) { resolve(file); return } // fallback to original
          // Only use compressed version if it's actually smaller
          if (blob.size >= file.size) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
            type: 'image/webp',
            lastModified: Date.now(),
          }))
        },
        'image/webp',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}
