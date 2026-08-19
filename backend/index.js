const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

let documentText = '';

// Endpoint to upload a document (PDF, TXT, etc.)
app.post('/api/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        
        // Simple handling for PDF and TXT for the prototype
        if (req.file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            documentText = data.text;
        } else {
            documentText = fs.readFileSync(filePath, 'utf8');
        }

        res.json({ message: 'Document uploaded and parsed successfully', textLength: documentText.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error processing document' });
    }
});

// Endpoint to ask a question
app.post('/api/ask', (req, res) => {
    const { question } = req.body;
    
    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    if (!documentText) {
        return res.status(400).json({ error: 'No document has been uploaded yet' });
    }

    // A simple prototype "AI" using keyword search
    const words = question.toLowerCase().split(' ').filter(w => w.length > 3);
    const paragraphs = documentText.split('\n\n');
    let bestMatch = '';
    let maxScore = 0;

    for (let p of paragraphs) {
        let score = 0;
        const pLower = p.toLowerCase();
        for (let w of words) {
            if (pLower.includes(w)) score++;
        }
        if (score > maxScore) {
            maxScore = score;
            bestMatch = p;
        }
    }

    let answerText = "I couldn't find a specific answer in the document.";
    if (maxScore > 0) {
        // Summarize by taking the first sentence or up to 100 characters.
        const cleanMatch = bestMatch.trim().replace(/\n/g, ' ');
        const firstSentence = cleanMatch.split('.')[0] + '.';
        answerText = firstSentence.length > 10 ? firstSentence : cleanMatch.substring(0, 100) + '...';
    }

    res.json({ answer: answerText });
});

// Load the document text on startup
try {
    documentText = fs.readFileSync('document.txt', 'utf8');
} catch (err) {
    console.log("No initial document.txt found. Upload one via API.");
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
