const express = require('express');
require('dotenv').config();
const pdf = require('pdf-parse');
const multer = require('multer');
const OpenAI = require('openai')
const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }
})

const client = new OpenAI({
    apiKey: process.env.GROK_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
})



const ExtractPdfAndParse = async (req, res) => {
    try {
        const data = req.file;
        if (!data) {
            return res.status(400).json({
                message: "File not uploaded"
            })
        }

        if (data.mimetype !== 'application/pdf') {
            return res.status(400).json({
                message: "Only PDF files are allowed"
            });
        }



        const fileData = await pdf(data.buffer);
        let text = fileData.text;

        text = text.replace(/\s+/g, ' ').trim();
        text = text.slice(0, 20000);

        console.log(text.slice(0, 500));
        const prompt = `
         You are a senior financial research analyst.

         Analyze the following earnings call transcript.

         Return  strictly valid JSON in this exact format:

 {
  "company_name": "",
  "quarter": "",
  "management_tone": "",
  "confidence_level": "",
  "key_positives": [],
  "key_concerns": [],
  "forward_guidance": "",
  "capacity_utilization_trend": "",
  "new_growth_initiatives": []
}

Instructions:

- Extract "company_name" from the transcript header.
- Extract "quarter" in format like "Q4 2025" or "FY 2025" if mentioned.
- Classify "management_tone" as one of: positive, cautious optimism, neutral, cautious, negative.
- Set "confidence_level" as low, medium, or high based on clarity and strength of management commentary.
- Populate arrays with concise bullet-point insights.
- Do NOT fabricate information.
- If any field cannot be determined, return null for that field.
- Return only valid JSON. No explanations. No markdown.

    Base your analysis only on the provided transcript. 
    Do not use external knowledge.


Transcript:
${text}
`;


        const completion = await client.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: "You are a financial analysis assistant. Always return strictly valid JSON. Do not include explanations or markdown."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,

        })

        let result = completion.choices[0].message.content;
        result = result.replace(/```json|```/g, "").trim()

        const parsed = JSON.parse(result);
        

        return res.json(parsed);

    } catch (error) {
        console.error("ERROR:", error);
        return res.status(500).json({
            message: "error in Extractfunction"
        })
    }
}


router.post("/analyze", upload.single("file"), ExtractPdfAndParse);

module.exports = router;