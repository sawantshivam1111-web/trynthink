import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export const MAX_CHARS = 60000

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  let text = ''
  if (name.endsWith('.txt')) {
    text = await file.text()
  } else if (name.endsWith('.pdf')) {
    const data = new Uint8Array(await file.arrayBuffer())
    const pdf = await pdfjsLib.getDocument({ data }).promise
    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      pages.push(content.items.map((it: any) => it.str).join(' '))
    }
    text = pages.join('\n\n')
  } else if (name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    text = result.value
  }
  return text.replace(/[ \t]+/g, ' ').trim().slice(0, MAX_CHARS)
}
