const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result))
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(file)
})

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = reject
  image.src = src
})

export async function removeImageBackground(file: File): Promise<string> {
  const source = await readAsDataUrl(file)
  const image = await loadImage(source)
  const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return source
  context.drawImage(image, 0, 0, width, height)
  const frame = context.getImageData(0, 0, width, height)
  const data = frame.data
  const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]
  const background = corners.map(([x, y]) => {
    const index = (y * width + x) * 4
    return [data[index], data[index + 1], data[index + 2]]
  })
  const visited = new Uint8Array(width * height)
  const queueX = new Int32Array(width * height)
  const queueY = new Int32Array(width * height)
  let head = 0
  let tail = 0
  const enqueue = (x: number, y: number) => {
    const position = y * width + x
    if (visited[position]) return
    visited[position] = 1
    queueX[tail] = x
    queueY[tail] = y
    tail += 1
  }
  for (let x = 0; x < width; x += 1) { enqueue(x, 0); enqueue(x, height - 1) }
  for (let y = 0; y < height; y += 1) { enqueue(0, y); enqueue(width - 1, y) }
  const distance = (index: number) => Math.min(...background.map(([red, green, blue]) => Math.hypot(data[index] - red, data[index + 1] - green, data[index + 2] - blue)))
  while (head < tail) {
    const x = queueX[head]
    const y = queueY[head]
    head += 1
    const index = (y * width + x) * 4
    const delta = distance(index)
    if (delta > 82) continue
    data[index + 3] = delta < 42 ? 0 : Math.round(((delta - 42) / 40) * 255)
    if (x > 0) enqueue(x - 1, y)
    if (x + 1 < width) enqueue(x + 1, y)
    if (y > 0) enqueue(x, y - 1)
    if (y + 1 < height) enqueue(x, y + 1)
  }
  context.putImageData(frame, 0, 0)
  return canvas.toDataURL('image/webp', 0.82)
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return readAsDataUrl(file)
}

export async function preparePhotoAsset(file: File): Promise<string> {
  const source = URL.createObjectURL(file)
  try {
    const image = await loadImage(source)
    const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas-unavailable')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.76)
  } finally { URL.revokeObjectURL(source) }
}
