import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { usePuterStore } from '~/lib/puter';
import Navbar from '~/components/Navbar';

const WipeApp = () => {
  const { auth, isLoading, error, fs, kv } = usePuterStore();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FSItem[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadFiles = async () => {
    const files = (await fs.readDir('./')) as FSItem[];
    setFiles(files || []);
  };

  const loadResumes = async () => {
    const resumeData = (await kv.list('resume:*', true)) as KVItem[];
    const parsedResumes = resumeData?.map(
      (resume) => JSON.parse(resume.value) as Resume
    );
    setResumes(parsedResumes || []);
  };

  useEffect(() => {
    loadFiles();
    loadResumes();
  }, []);

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate('/auth?next=/wipe');
    }
  }, [isLoading]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Hapus semua file
      await Promise.all(
        files.map(async (file) => {
          try {
            await fs.delete(file.path);
          } catch (error) {
            console.warn(`Failed to delete file: ${file.path}`, error);
          }
        })
      );

      // Hapus semua data KV
      await kv.flush();

      // Reload data
      await loadFiles();
      await loadResumes();

      setShowConfirm(false);
    } catch (error) {
      console.error('Error deleting data:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (size: number) => {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return '📄';
    if (fileName.endsWith('.png') || fileName.endsWith('.jpg')) return '🖼️';
    return '📁';
  };

  if (isLoading) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-red-800 mb-2">
                Terjadi Kesalahan
              </h2>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">🗑️</div>
              <h3 className="text-xl font-bold mb-4">Konfirmasi Hapus Data</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus semua data aplikasi? Tindakan
                ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isDeleting}
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Menghapus...' : 'Hapus Semua'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Kelola Data Aplikasi</h1>
          <h2>Pantau dan kelola data yang tersimpan di aplikasi Anda</h2>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* User Info Card */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Informasi Pengguna</h3>
                <p className="text-gray-600">
                  Terautentikasi sebagai:{' '}
                  <span className="font-medium text-blue-600">
                    {auth.user?.username}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-600">
                    {resumes.length}
                  </h3>
                  <p className="text-gray-600">Resume Tersimpan</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📁</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-600">
                    {files.length}
                  </h3>
                  <p className="text-gray-600">File Tersimpan</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💾</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-600">
                    {formatFileSize(
                      files.reduce((total, file) => total + (file.size || 0), 0)
                    )}
                  </h3>
                  <p className="text-gray-600">Total Ukuran</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resume List */}
          {resumes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Daftar Resume
              </h3>
              <div className="space-y-3">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">📄</span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {resume.companyName} - {resume.jobTitle}
                        </p>
                        <p className="text-sm text-gray-500">
                          Skor: {resume.feedback.overallScore}/100
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        ID: {resume.id}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📁</span>
                Daftar File
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">
                          {getFileIcon(file.name)}
                        </span>
                      </div>
                      <div>
                        <p
                          className="font-medium truncate max-w-xs"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-xs text-gray-400 truncate max-w-xs"
                        title={file.path}
                      >
                        {file.path}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && resumes.length === 0 && (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-2">Aplikasi Bersih!</h3>
              <p className="text-gray-600">
                Tidak ada data yang tersimpan di aplikasi.
              </p>
            </div>
          )}

          {/* Danger Zone */}
          {(files.length > 0 || resumes.length > 0) && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Zona Bahaya
              </h3>
              <p className="text-red-700 mb-4">
                Menghapus semua data akan menghilangkan seluruh resume, file,
                dan analisis yang tersimpan. Tindakan ini tidak dapat
                dibatalkan.
              </p>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <span className="text-xl">🗑️</span>
                {isDeleting ? 'Menghapus Data...' : 'Hapus Semua Data'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default WipeApp;
