export const resumes: Resume[] = [
  {
    id: '1',
    companyName: 'Google',
    jobTitle: 'Frontend Developer',
    imagePath: '/images/resume_01.png',
    resumePath: '/resumes/resume-1.pdf',
    feedback: {
      overallScore: 85,
      ATS: {
        score: 90,
        tips: [],
      },
      toneAndStyle: {
        score: 90,
        tips: [],
      },
      content: {
        score: 90,
        tips: [],
      },
      structure: {
        score: 90,
        tips: [],
      },
      skills: {
        score: 90,
        tips: [],
      },
    },
  },
  {
    id: '2',
    companyName: 'Microsoft',
    jobTitle: 'Cloud Engineer',
    imagePath: '/images/resume_02.png',
    resumePath: '/resumes/resume-2.pdf',
    feedback: {
      overallScore: 55,
      ATS: {
        score: 90,
        tips: [],
      },
      toneAndStyle: {
        score: 90,
        tips: [],
      },
      content: {
        score: 90,
        tips: [],
      },
      structure: {
        score: 90,
        tips: [],
      },
      skills: {
        score: 90,
        tips: [],
      },
    },
  },
  {
    id: '3',
    companyName: 'Apple',
    jobTitle: 'iOS Developer',
    imagePath: '/images/resume_03.png',
    resumePath: '/resumes/resume-3.pdf',
    feedback: {
      overallScore: 75,
      ATS: {
        score: 90,
        tips: [],
      },
      toneAndStyle: {
        score: 90,
        tips: [],
      },
      content: {
        score: 90,
        tips: [],
      },
      structure: {
        score: 90,
        tips: [],
      },
      skills: {
        score: 90,
        tips: [],
      },
    },
  },
  {
    id: '4',
    companyName: 'Google',
    jobTitle: 'Frontend Developer',
    imagePath: '/images/resume_01.png',
    resumePath: '/resumes/resume-1.pdf',
    feedback: {
      overallScore: 85,
      ATS: {
        score: 90,
        tips: [],
      },
      toneAndStyle: {
        score: 90,
        tips: [],
      },
      content: {
        score: 90,
        tips: [],
      },
      structure: {
        score: 90,
        tips: [],
      },
      skills: {
        score: 90,
        tips: [],
      },
    },
  },
  {
    id: '5',
    companyName: 'Microsoft',
    jobTitle: 'Cloud Engineer',
    imagePath: '/images/resume_02.png',
    resumePath: '/resumes/resume-2.pdf',
    feedback: {
      overallScore: 55,
      ATS: {
        score: 90,
        tips: [],
      },
      toneAndStyle: {
        score: 90,
        tips: [],
      },
      content: {
        score: 90,
        tips: [],
      },
      structure: {
        score: 90,
        tips: [],
      },
      skills: {
        score: 90,
        tips: [],
      },
    },
  },
  {
    id: '6',
    companyName: 'Apple',
    jobTitle: 'iOS Developer',
    imagePath: '/images/resume_03.png',
    resumePath: '/resumes/resume-3.pdf',
    feedback: {
      overallScore: 75,
      ATS: {
        score: 90,
        tips: [],
      },
      toneAndStyle: {
        score: 90,
        tips: [],
      },
      content: {
        score: 90,
        tips: [],
      },
      structure: {
        score: 90,
        tips: [],
      },
      skills: {
        score: 90,
        tips: [],
      },
    },
  },
];

export const AIResponseFormat = `
      interface Feedback {
      overallScore: number; //maksimal 100
      ATS: {
        score: number; //nilai berdasarkan kesesuaian ATS
        tips: {
          type: "good" | "improve";
          tip: string; //berikan 3-4 tips
        }[];
      };
      toneAndStyle: {
        score: number; //maksimal 100
        tips: {
          type: "good" | "improve";
          tip: string; //buat sebagai "judul" singkat untuk penjelasan sebenarnya
          explanation: string; //jelaskan secara detail di sini
        }[]; //berikan 3-4 tips
      };
      content: {
        score: number; //maksimal 100
        tips: {
          type: "good" | "improve";
          tip: string; //buat sebagai "judul" singkat untuk penjelasan sebenarnya
          explanation: string; //jelaskan secara detail di sini
        }[]; //berikan 3-4 tips
      };
      structure: {
        score: number; //maksimal 100
        tips: {
          type: "good" | "improve";
          tip: string; //buat sebagai "judul" singkat untuk penjelasan sebenarnya
          explanation: string; //jelaskan secara detail di sini
        }[]; //berikan 3-4 tips
      };
      skills: {
        score: number; //maksimal 100
        tips: {
          type: "good" | "improve";
          tip: string; //buat sebagai "judul" singkat untuk penjelasan sebenarnya
          explanation: string; //jelaskan secara detail di sini
        }[]; //berikan 3-4 tips
      };
    }`;

export const prepareInstructions = ({
  jobTitle,
  jobDescription,
}: {
  jobTitle: string;
  jobDescription: string;
}) =>
  `Anda adalah seorang ahli dalam ATS (Applicant Tracking System) dan analisis resume.
      Silakan analisis dan beri nilai resume ini serta berikan saran untuk memperbaikinya.
      Penilaian bisa rendah jika resume memang buruk.
      Lakukan analisis yang menyeluruh dan detail. Jangan ragu untuk menunjukkan kesalahan atau area yang perlu diperbaiki.
      Jika ada banyak yang perlu diperbaiki, jangan ragu untuk memberikan skor rendah. Ini untuk membantu pengguna memperbaiki resume mereka.
      Jika tersedia, gunakan deskripsi pekerjaan untuk posisi yang akan dilamar pengguna untuk memberikan umpan balik yang lebih detail.
      Jika disediakan, pertimbangkan deskripsi pekerjaan tersebut.
      Jabatan yang dilamar: ${jobTitle}
      Deskripsi pekerjaan: ${jobDescription}
      Berikan umpan balik menggunakan format berikut:
      ${AIResponseFormat}
      Kembalikan analisis sebagai objek JSON, tanpa teks lain dan tanpa backticks.
      Jangan sertakan teks atau komentar lain. Berikan semua umpan balik dalam bahasa Indonesia.`;
