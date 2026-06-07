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

  console.log(
    'PATH:',
    req.file.path
  );

  res.json({
    url: req.file.path,
  });
};