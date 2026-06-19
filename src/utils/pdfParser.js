import * as pdfjsLib from 'pdfjs-dist'

// Point worker to the exact file in the installed package
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    standardFontDataUrl: new URL(
      'pdfjs-dist/standard_fonts/',
      import.meta.url
    ).href,
    cMapUrl: new URL(
      'pdfjs-dist/cmaps/',
      import.meta.url
    ).href,
    cMapPacked: true,
  }).promise

  const pageTexts = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    pageTexts.push(pageText)
  }

  return pageTexts.join('\n')
}
