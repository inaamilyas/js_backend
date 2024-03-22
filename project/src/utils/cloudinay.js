import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
          
cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET 
  cloud_name: 'dyd2rubyb', 
  api_key: '156846643623383', 
  api_secret: 'zs8sNr2Nzjmcc9d1LReyF9pzkC4' 
});

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if (!localFilePath) return null; 
        
        console.log("upload the file on cloudinary...");
        // upload the file on the cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: 'auto',
        });

        // file has been uploaded successfully
        console.log("File is uploaded successfully on cloudinary", response.url);
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        console.log(error);
        fs.unlinkSync(localFilePath); // remove locally saved temporary file as the upload operation failed
        return null;
    }
}

export {uploadOnCloudinary}