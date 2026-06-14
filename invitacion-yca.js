const {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle,
} = require('docx')
const fs = require('fs')

// DXA helpers: 1 inch = 1440, 1 cm = 567
const CM = 567
const PT = 20 // 1pt = 20 twips

// Colores
const NEGRO   = '1A1A1A'
const GRIS    = '999999'
const GRIS_M  = '555555'
const AMARILLO= 'F5C800'

// Espaciado común
const sp = (before, after) => ({ spacing: { before: before * PT, after: after * PT } })

// Borde inferior decorativo
const borderBottom = (color = 'CCCCCC', size = 4) => ({
  border: { bottom: { style: BorderStyle.SINGLE, size, color, space: 1 } }
})

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Georgia', size: 22, color: NEGRO } },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 8505, height: 12006 }, // DL aprox: 11cm x 21cm en DXA (567*11, 567*21)
        margin: { top: 2 * CM, right: 2 * CM, bottom: 2 * CM, left: 2 * CM },
      },
    },
    children: [

      // ── PUNTO AMARILLO (simulado con texto símbolo) ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 2),
        children: [new TextRun({ text: '●', color: AMARILLO, size: 22, font: 'Arial' })],
      }),

      // ── YELLOW ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 0),
        children: [new TextRun({ text: 'YELLOW', font: 'Arial', bold: true, size: 32, color: NEGRO, characterSpacing: 180 })],
      }),

      // ── Craft ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 0),
        children: [new TextRun({ text: 'Craft', font: 'Georgia', italics: true, size: 30, color: NEGRO })],
      }),

      // ── ACADEMY ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 2),
        children: [new TextRun({ text: 'ACADEMY', font: 'Arial', bold: true, size: 32, color: NEGRO, characterSpacing: 180 })],
      }),

      // ── Lanzarote · 2026 ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 18),
        children: [new TextRun({ text: 'Lanzarote · 2026', font: 'Arial', size: 14, color: GRIS, characterSpacing: 100 })],
      }),

      // ── — UNA INVITACIÓN PERSONAL — ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(6, 18),
        border: {
          top:    { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 6 },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 6 },
        },
        children: [new TextRun({
          text: '— Una invitación personal —',
          font: 'Arial', bold: true, size: 14, color: NEGRO, characterSpacing: 150,
        })],
      }),

      // ── 18:00 ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(6, 6),
        children: [new TextRun({ text: '18:00', font: 'Arial', bold: true, size: 110, color: NEGRO })],
      }),

      // ── 15 DE JUNIO · SALA OCEAN · PUERTO DEL CARMEN ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 18),
        children: [
          new TextRun({ text: '15 de junio  ·  ', font: 'Arial', size: 14, color: GRIS_M, characterSpacing: 80 }),
          new TextRun({ text: 'Sala Ocean', font: 'Arial', bold: true, size: 14, color: NEGRO, characterSpacing: 80 }),
          new TextRun({ text: '  ·  Puerto del Carmen', font: 'Arial', size: 14, color: GRIS_M, characterSpacing: 80 }),
        ],
      }),

      // ── Separador ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 14),
        ...borderBottom('CCCCCC', 4),
        children: [new TextRun({ text: '' })],
      }),

      // ── Copy 1 ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(14, 6),
        children: [new TextRun({ text: 'Hay días que no se olvidan.', font: 'Georgia', size: 22, color: NEGRO })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 14),
        children: [new TextRun({ text: 'El 15 de junio es uno de ellos.', font: 'Georgia', size: 22, color: NEGRO })],
      }),

      // ── Copy 2 ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 0),
        children: [new TextRun({ text: 'Yellow Craft Academy reúne a quienes han hecho', font: 'Georgia', size: 22, color: NEGRO })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 0),
        children: [
          new TextRun({ text: 'del oficio ', font: 'Georgia', size: 22, color: NEGRO }),
          new TextRun({ text: 'una forma de vida.', font: 'Georgia', size: 22, italics: true, bold: true, color: NEGRO }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 14),
        children: [new TextRun({ text: 'A los que madrugan, prueban y no se conforman.', font: 'Georgia', size: 22, color: NEGRO })],
      }),

      // ── Copy 3 ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 0),
        children: [new TextRun({ text: 'Al caer la tarde, paramos.', font: 'Georgia', size: 22, color: NEGRO })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 0),
        children: [new TextRun({ text: 'Y celebramos lo que somos', font: 'Georgia', size: 22, color: NEGRO })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 18),
        children: [new TextRun({ text: 'con quienes lo entienden sin explicación.', font: 'Georgia', size: 22, italics: true, color: NEGRO })],
      }),

      // ── Personas como tú. ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 22),
        children: [new TextRun({ text: 'Personas como tú.', font: 'Georgia', italics: true, size: 40, color: NEGRO })],
      }),

      // ── DE SEIS A NUEVE DE LA TARDE ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 4),
        children: [new TextRun({ text: 'DE SEIS A NUEVE DE LA TARDE', font: 'Arial', size: 12, color: GRIS, characterSpacing: 120 })],
      }),

      // ── TARDEO · CONVERSACIÓN · ENCUENTRO ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 22),
        children: [
          new TextRun({ text: 'TARDEO', font: 'Arial', bold: true, size: 14, color: NEGRO, characterSpacing: 140 }),
          new TextRun({ text: '  ●  ', font: 'Arial', size: 10, color: AMARILLO }),
          new TextRun({ text: 'CONVERSACIÓN', font: 'Arial', bold: true, size: 14, color: NEGRO, characterSpacing: 140 }),
          new TextRun({ text: '  ●  ', font: 'Arial', size: 10, color: AMARILLO }),
          new TextRun({ text: 'ENCUENTRO', font: 'Arial', bold: true, size: 14, color: NEGRO, characterSpacing: 140 }),
        ],
      }),

      // ── Te esperamos. ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 14),
        children: [new TextRun({ text: 'Te esperamos.', font: 'Georgia', italics: true, size: 30, color: NEGRO })],
      }),

      // ── Vanessa ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(0, 6),
        children: [new TextRun({ text: 'Vanessa', font: 'Georgia', size: 32, bold: false, color: NEGRO })],
      }),

      // ── Nota mariposa ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        ...sp(6, 0),
        children: [new TextRun({ text: '🦋', font: 'Segoe UI Emoji', size: 36 })],
      }),

    ],
  }],
})

Packer.toBuffer(doc).then(buffer => {
  const out = 'C:\\Users\\ManfredVotteler\\OneDrive - Avaseleccion\\Escritorio\\yellow-craft-academy\\Invitacion-YCA-2026.docx'
  fs.writeFileSync(out, buffer)
  console.log('OK:', out)
}).catch(e => { console.error(e); process.exit(1) })
