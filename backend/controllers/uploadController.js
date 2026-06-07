export const uploadImage = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided.' });
  }
  const url = req.file.path
  res.json({ url });
};
