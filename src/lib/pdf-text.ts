export const PDF_LIMITS = { maxPages: 60, maxChars: 120_000, minChars: 200 };

export class PdfTextError extends Error {
  constructor(
    public kind: "unreadable" | "password" | "scanned",
    message: string,
  ) {
    super(message);
    this.name = "PdfTextError";
  }
}

export const usableLength = (text: string) => text.replace(/\[Səhifə \d+\]/g, "").replace(/\s+/g, "").length;

export async function extractPdfText(file: File, onPage?: (page: number, total: number) => void) {
  const pdfjs = await import("pdfjs-dist");
  const { default: workerSrc } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let doc;
  try {
    doc = await task.promise;
  } catch (e) {
    if ((e as Error).name === "PasswordException") throw new PdfTextError("password", "PDF şifrə ilə qorunur. Şifrəsiz versiyasını yüklə.");
    throw new PdfTextError("unreadable", "PDF faylı oxunmadı — zədələnmiş və ya PDF olmaya bilər.");
  }

  const pages = doc.numPages;
  const limit = Math.min(pages, PDF_LIMITS.maxPages);
  let text = "";
  let truncated = pages > limit;
  for (let i = 1; i <= limit; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    const pageText = content.items
      .map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : ""))
      .join("")
      .replace(/[ \t]+/g, " ")
      .trim();
    if (pageText) text += `[Səhifə ${i}]\n${pageText}\n\n`;
    onPage?.(i, limit);
    if (text.length >= PDF_LIMITS.maxChars) {
      text = text.slice(0, PDF_LIMITS.maxChars);
      truncated = i < pages || truncated;
      break;
    }
  }
  await task.destroy();

  if (usableLength(text) < PDF_LIMITS.minChars)
    throw new PdfTextError("scanned", "PDF-də oxunan mətn tapılmadı — skan edilmiş (şəkil) PDF ola bilər. Mətni seçilə bilən PDF yüklə və ya daxili AI rejimini seç.");
  return { text, pages, truncated };
}
