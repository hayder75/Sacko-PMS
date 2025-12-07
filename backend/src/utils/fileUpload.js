import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'planFile') {
      uploadPath += 'plans/';
    } else if (file.fieldname === 'cbsFile') {
      uploadPath += 'cbs/';
    } else if (file.fieldname === 'evidence') {
      uploadPath += 'evidence/';
    } else if (file.fieldname === 'file') {
      uploadPath += 'june-balance/';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = {
    'planFile': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/vnd.ms-excel'],
    'cbsFile': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    'evidence': ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    'file': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/vnd.ms-excel'],
  };

  if (allowedMimes[file.fieldname]?.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
});

