import { type FormEvent, useState, useEffect } from 'react';
import Navbar from '~/components/Navbar';
import FileUploader from '~/components/FileUploader';
import { usePuterStore } from '~/lib/puter';
import { useNavigate } from 'react-router';
import { convertPdfToImage, preloadPdfJs } from '~/lib/pdf2img';
import { generateUUID } from '~/lib/utils';
import { prepareInstructions } from '../../constants';

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pdfLibReady, setPdfLibReady] = useState(false);

  // Preload PDF.js saat component mount
  useEffect(() => {
    const initPdfLib = async () => {
      try {
        const success = await preloadPdfJs();
        setPdfLibReady(success);
        if (!success) {
          console.warn('PDF.js failed to preload, will load on demand');
        }
      } catch (error) {
        console.error('Error preloading PDF.js:', error);
      }
    };

    initPdfLib();
  }, []);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);

    try {
      setStatusText('Mengunggah file...');
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) {
        throw new Error('Failed to upload file');
      }

      setStatusText('Mengkonversi PDF ke gambar...');

      // Improved error handling for PDF conversion
      const imageResult = await convertPdfToImage(file, {
        scale: 2,
        quality: 0.9,
      });

      if (imageResult.error || !imageResult.file) {
        throw new Error(
          `PDF conversion failed: ${imageResult.error || 'Unknown error'}`
        );
      }

      setStatusText('Mengunggah gambar yang telah dikonversi...');
      const uploadedImage = await fs.upload([imageResult.file]);
      if (!uploadedImage) {
        throw new Error('Failed to upload converted image');
      }

      setStatusText('Menyiapkan data analisis...');
      const uuid = generateUUID();
      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: '',
      };
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText('Menganalisis resume dengan AI...');

      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({ jobTitle, jobDescription })
      );

      if (!feedback) {
        throw new Error('AI analysis failed - no response received');
      }

      const feedbackText =
        typeof feedback.message.content === 'string'
          ? feedback.message.content
          : feedback.message.content[0].text;

      try {
        data.feedback = JSON.parse(feedbackText);
      } catch (parseError) {
        console.error('Failed to parse AI feedback:', parseError);
        // Fallback: store as string if JSON parse fails
        data.feedback = feedbackText;
      }

      await kv.set(`resume:${uuid}`, JSON.stringify(data));
      setStatusText('Analisis selesai! Mengalihkan...');

      // console.log('Analysis completed:', data);

      // Small delay to show completion message
      setTimeout(() => {
        navigate(`/resume/${uuid}`);
      }, 1000);
    } catch (error: any) {
      console.error('Analisis gagal:', error);
      setStatusText(
        `Error: ${error.message || 'Analisis gagal. Silakan coba lagi.'}`
      );
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert('Silakan pilih file PDF terlebih dahulu');
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    // Basic validation
    if (!companyName.trim()) {
      alert('Silakan masukkan nama perusahaan');
      return;
    }

    if (!jobTitle.trim()) {
      alert('Silakan masukkan jabatan');
      return;
    }

    if (!jobDescription.trim()) {
      alert('Silakan masukkan deskripsi pekerjaan');
      return;
    }

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img
                src="/images/resume-scan.gif"
                className="w-full"
                alt="Sedang memproses..."
              />
              <button
                onClick={() => {
                  setIsProcessing(false);
                  setStatusText('');
                }}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Batal
              </button>
            </>
          ) : (
            <>
              <h2>
                Jatuhkan resume Anda untuk mendapatkan skor ATS dan tips
                perbaikan
              </h2>
              {!pdfLibReady && (
                <div className="text-yellow-600 text-sm mt-2">
                  ⚠️ Pustaka PDF sedang dimuat... PDF besar mungkin memerlukan
                  waktu lebih lama untuk diproses.
                </div>
              )}
            </>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Nama Perusahaan *</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="contoh: Google, Microsoft"
                  id="company-name"
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-title">Jabatan *</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="contoh: Software Engineer, Product Manager"
                  id="job-title"
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-description">Deskripsi Pekerjaan *</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Tempel deskripsi pekerjaan lengkap di sini..."
                  id="job-description"
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Unggah Resume (PDF) *</label>
                <FileUploader onFileSelect={handleFileSelect} />
                {file && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ Terpilih: {file.name} (
                    {(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <button
                className="primary-button"
                type="submit"
                disabled={!file || !pdfLibReady}
              >
                {!pdfLibReady ? 'Memuat Pustaka PDF...' : 'Analisis Resume'}
              </button>

              <div className="text-xs text-gray-500 mt-2">
                * Semua kolom wajib diisi. Hanya file PDF yang didukung.
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
