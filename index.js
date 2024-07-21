
  const express = require('express');
  const { OpenAI } = require('openai');
  const bodyParser = require('body-parser');
  const fs = require('fs');
  const path = require('path');
  const axios = require('axios');
  const cors = require('cors');
  const Tesseract = require('tesseract.js'); // Include Tesseract.js for OCR
  const dotenv = require('dotenv');
  const app = express();


  dotenv.config();
  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));
  
  const openai = new OpenAI({
    apiKey: process.env.API_KEY
});
  
  app.post('/upload', async (req, res) => {
      try {
          const { image } = req.body;
  
          if (!image) {
              return res.status(400).json({ error: 'No image provided' });
          }
  
          // Save image locally
          const imageData = image.split(',')[1]; // Strip out "data:image/png;base64,"
          const imagePath = path.join(__dirname, 'uploads', 'image.png');
          fs.writeFileSync(imagePath, imageData, { encoding: 'base64' });
  
          // Perform OCR to extract text from the image
          const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
  
          // Use the extracted text in the OpenAI API call
          const response = await openai.chat.completions.create({
              model: 'gpt-4-vision-preview',
              messages: [
                  {
                      role: 'user',
                      content: `Analyze the following ingredients from the packed food item and rate its healthiness from 1 to 100: ${text}`
                  }
              ]
          });
  
          const result = response.choices[0].message.content;
          res.json({ message: result });
      } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  });
  
  app.listen(process.env.PORT, () => {
      console.log('Server is running on port 3000');
  });
  