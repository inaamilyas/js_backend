import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); //folder name
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); //filenames
  },
});

export const upload = multer({ storage: storage });
