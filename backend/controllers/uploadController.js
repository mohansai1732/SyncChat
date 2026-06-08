export const uploadImage = (
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

  res.json({
    url,
  });
};
