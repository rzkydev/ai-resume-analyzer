// pdf2image.ts

export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

// Global variable untuk cache library
let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

// Declare global type untuk TypeScript
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

/**
 * Load PDF.js library secara dinamis
 */
async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  isLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    // Cek apakah sudah ada di global scope
    if (window.pdfjsLib) {
      pdfjsLib = window.pdfjsLib;
      isLoading = false;
      resolve(pdfjsLib);
      return;
    }

    // Load script dinamis
    const script = document.createElement('script');
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;

    script.onload = () => {
      // PDF.js akan tersedia di window.pdfjsLib
      const lib = window.pdfjsLib;
      if (lib) {
        // Set worker dari CDN
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        pdfjsLib = lib;
        isLoading = false;
        resolve(lib);
      } else {
        isLoading = false;
        reject(new Error('PDF.js library tidak ditemukan setelah load'));
      }
    };

    script.onerror = (error) => {
      isLoading = false;
      reject(new Error(`Gagal memuat PDF.js dari CDN: ${error}`));
    };

    // Tambahkan timeout
    setTimeout(() => {
      if (isLoading) {
        isLoading = false;
        reject(new Error('Timeout saat memuat PDF.js library'));
      }
    }, 15000); // 15 detik timeout

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Validasi file PDF
 */
function validatePdfFile(file: File): void {
  if (!file) {
    throw new Error('File tidak ditemukan');
  }

  if (
    file.type !== 'application/pdf' &&
    !file.name.toLowerCase().endsWith('.pdf')
  ) {
    throw new Error('File bukan format PDF yang valid');
  }

  if (file.size === 0) {
    throw new Error('File PDF kosong');
  }

  if (file.size > 50 * 1024 * 1024) {
    // 50MB limit
    throw new Error('File PDF terlalu besar (maksimal 50MB)');
  }
}

/**
 * Convert PDF ke Image
 */
export async function convertPdfToImage(
  file: File,
  options: {
    scale?: number;
    quality?: number;
    pageNumber?: number;
  } = {}
): Promise<PdfConversionResult> {
  const { scale = 2, quality = 0.9, pageNumber = 1 } = options;

  try {
    // Validasi file
    validatePdfFile(file);

    // Load PDF.js library
    console.log('Loading PDF.js library...');
    const lib = await loadPdfJs();

    if (!lib) {
      throw new Error('Gagal memuat library PDF.js');
    }

    console.log('Converting file to array buffer...');
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Gagal membaca file PDF');
    }

    console.log('Loading PDF document...');
    // Load PDF document
    let pdf;
    try {
      const loadingTask = lib.getDocument({
        data: arrayBuffer,
        verbosity: 0, // Mengurangi log output
        disableAutoFetch: true,
        disableStream: true,
      });

      pdf = await Promise.race([
        loadingTask.promise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout loading PDF document')),
            20000
          )
        ),
      ]);
    } catch (pdfError: any) {
      throw new Error(
        `PDF tidak valid atau rusak: ${pdfError.message || pdfError}`
      );
    }

    if (!pdf || pdf.numPages === 0) {
      throw new Error('PDF tidak memiliki halaman');
    }

    if (pageNumber > pdf.numPages) {
      throw new Error(
        `Halaman ${pageNumber} tidak ada. PDF hanya memiliki ${pdf.numPages} halaman`
      );
    }

    console.log(`Loading page ${pageNumber}...`);
    // Get specified page
    const page = await pdf.getPage(pageNumber);

    if (!page) {
      throw new Error(`Gagal memuat halaman ${pageNumber}`);
    }

    // Set viewport
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Gagal membuat canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Set canvas properties untuk kualitas lebih baik
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    console.log('Rendering PDF page to canvas...');
    // Render page to canvas
    try {
      await Promise.race([
        page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout saat render PDF')), 30000)
        ),
      ]);
    } catch (renderError: any) {
      throw new Error(
        `Gagal render halaman PDF: ${renderError.message || renderError}`
      );
    }

    console.log('Converting canvas to image...');
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout saat konversi canvas ke blob'));
      }, 10000);

      try {
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeoutId);

            if (blob && blob.size > 0) {
              // Create a File from the blob
              const originalName = file.name.replace(/\.pdf$/i, '');
              const imageFile = new File([blob], `${originalName}.png`, {
                type: 'image/png',
              });

              console.log('PDF conversion successful!');
              resolve({
                imageUrl: URL.createObjectURL(blob),
                file: imageFile,
              });
            } else {
              reject(new Error('Gagal membuat image blob dari canvas'));
            }
          },
          'image/png',
          quality
        );
      } catch (blobError: any) {
        clearTimeout(timeoutId);
        reject(
          new Error(
            `Error saat konversi ke blob: ${blobError.message || blobError}`
          )
        );
      }
    });
  } catch (err: any) {
    console.error('PDF Conversion Error:', err);

    // Bersihkan resources jika error
    cleanupPdfResources();

    return {
      imageUrl: '',
      file: null,
      error: `Gagal konversi PDF: ${err.message || String(err)}`,
    };
  }
}

/**
 * Convert multiple pages PDF ke multiple images
 */
export async function convertPdfToImages(
  file: File,
  options: {
    scale?: number;
    quality?: number;
    maxPages?: number;
  } = {}
): Promise<PdfConversionResult[]> {
  const { maxPages = 10 } = options;

  try {
    validatePdfFile(file);

    const lib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;

    const totalPages = Math.min(pdf.numPages, maxPages);
    const results: PdfConversionResult[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const result = await convertPdfToImage(file, {
        ...options,
        pageNumber: i,
      });
      results.push(result);

      if (result.error) {
        console.warn(`Error converting page ${i}:`, result.error);
      }
    }

    return results;
  } catch (err: any) {
    return [
      {
        imageUrl: '',
        file: null,
        error: `Gagal konversi PDF multi-page: ${err.message || String(err)}`,
      },
    ];
  }
}

/**
 * Utility function untuk membersihkan memory
 */
export function cleanupPdfResources(): void {
  if (pdfjsLib) {
    // Reset library
    pdfjsLib = null;
    loadPromise = null;
    isLoading = false;
  }
}

/**
 * Check apakah PDF.js sudah ready
 */
export function isPdfJsReady(): boolean {
  return pdfjsLib !== null || window.pdfjsLib !== undefined;
}

/**
 * Preload PDF.js library
 */
export async function preloadPdfJs(): Promise<boolean> {
  try {
    await loadPdfJs();
    return true;
  } catch (error) {
    console.error('Failed to preload PDF.js:', error);
    return false;
  }
}
