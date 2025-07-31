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
      setStatusText('Uploading the file...');
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) {
        throw new Error('Failed to upload file');
      }

      setStatusText('Converting PDF to image...');

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

      setStatusText('Uploading the converted image...');
      const uploadedImage = await fs.upload([imageResult.file]);
      if (!uploadedImage) {
        throw new Error('Failed to upload converted image');
      }

      setStatusText('Preparing analysis data...');
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

      setStatusText('Analyzing resume with AI...');

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
      setStatusText('Analysis complete! Redirecting...');

      console.log('Analysis completed:', data);

      // Small delay to show completion message
      setTimeout(() => {
        navigate(`/resume/${uuid}`);
      }, 1000);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      setStatusText(
        `Error: ${error.message || 'Analysis failed. Please try again.'}`
      );
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a PDF file first');
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    // Basic validation
    if (!companyName.trim()) {
      alert('Please enter company name');
      return;
    }

    if (!jobTitle.trim()) {
      alert('Please enter job title');
      return;
    }

    if (!jobDescription.trim()) {
      alert('Please enter job description');
      return;
    }

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img
                src="/images/resume-scan.gif"
                className="w-full"
                alt="Processing..."
              />

              {/* Show cancel button if processing takes too long */}
              <button
                onClick={() => {
                  setIsProcessing(false);
                  setStatusText('');
                }}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <h2>Drop your resume for an ATS score and improvement tips</h2>

              {/* Show PDF library status */}
              {!pdfLibReady && (
                <div className="text-yellow-600 text-sm mt-2">
                  ⚠️ PDF library is loading... Large PDFs may take longer to
                  process.
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
                <label htmlFor="company-name">Company Name *</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="e.g., Google, Microsoft"
                  id="company-name"
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-title">Job Title *</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="e.g., Software Engineer, Product Manager"
                  id="job-title"
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-description">Job Description *</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Paste the complete job description here..."
                  id="job-description"
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume (PDF) *</label>
                <FileUploader onFileSelect={handleFileSelect} />
                {file && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ Selected: {file.name} (
                    {(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <button
                className="primary-button"
                type="submit"
                disabled={!file || !pdfLibReady}
              >
                {!pdfLibReady ? 'Loading PDF Library...' : 'Analyze Resume'}
              </button>

              <div className="text-xs text-gray-500 mt-2">
                * All fields are required. Only PDF files are supported.
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
