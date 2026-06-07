import multer from 'multer';

import {
  CloudinaryStorage,
} from 'multer-storage-cloudinary';

import cloudinary
from '../config/cloudinary.js';

const storage =
  new CloudinaryStorage({

    cloudinary,

    params: async (
      req,
      file
    ) => {

      return {

        folder: 'syncchat',

        resource_type: 'auto',

        public_id:
          Date.now() +
          '-' +
          file.originalname
            .split('.')[0],
      };
    },
  });

const fileFilter = (
  req,
  file,
  cb
) => {

  const allowed = [

    'image/jpeg',

    'image/png',

    'image/gif',

    'image/webp',

    'video/mp4',

    'application/pdf',

    'application/msword',

    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (
    allowed.includes(
      file.mimetype
    )
  ) {

    cb(null, true);

  } else {

    cb(
      new Error(
        'Unsupported file type'
      ),
      false
    );
  }
};

export const upload =
  multer({

    storage,

    fileFilter,

    limits: {
      fileSize:
        20 * 1024 * 1024,
    },
  });