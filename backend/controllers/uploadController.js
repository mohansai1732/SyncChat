export const uploadFile = (
  req,
  res,
  next
) => {

  console.log(
    'FILE:',
    req.file
  );

  console.log(
    'BODY:',
    req.body
  );

  if (!req.file) {

    return res.status(400).json({
      message:
        'No file uploaded',
    });
  }

  const url = req.file.secure_url || req.file.path || req.file.url;
  const mimeType = req.file.mimetype || '';
  const isImage = mimeType.startsWith('image/');

  res.json({
    url,
    name: req.file.originalname,
    mimeType,
    size: req.file.size || 0,
    type: isImage ? 'image' : 'file',
  });
};
