require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const fs = require('fs');

const app = express();
// Use memory storage for Vercel (Serverless) compatibility
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAW86iX9SnkTfdaNU8I1r1msHofXtfqT_4';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-4b-it:generateContent';

app.post('/api/tailor', upload.single('resume'), async (req, res) => {
    // We allow either jobUrl OR jobText
    if (!req.file || (!req.body.jobUrl && !req.body.jobText)) {
        return res.status(400).json({ error: 'Resume file and either Job URL or Job Description text are required.' });
    }

    try {
        // 1. Parse PDF from Buffer (No file write needed)
        const pdfData = await pdf(req.file.buffer);
        const resumeText = pdfData.text;

        // 2. Obtain Job Description (Scrape or Direct Text)
        let jobDescription = req.body.jobText || '';

        // If no text provided, try scraping the URL
        if (!jobDescription && req.body.jobUrl) {
            try {
                // Improved User-Agent and Headers 
                const response = await axios.get(req.body.jobUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                        'Connection': 'keep-alive'
                    }
                });
                const $ = cheerio.load(response.data);
                $('script, style, nav, footer, header, aside, iframe, noscript').remove();
                jobDescription = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 15000);
            } catch (error) {
                console.error('Error fetching job URL:', error.message);
                return res.status(403).json({
                    error: "Access to this job site is restricted by security bots.",
                    code: "SCRAPING_FAILED",
                    details: error.message
                });
            }
        }

        if (!jobDescription || jobDescription.length < 50) {
            return res.status(400).json({ error: "Could not retrieve enough text from the job description. Please paste the text manually." });
        }

        const prompt = `
        You are an expert resume writer and career coach. I will provide you with a resume text and a target job description.
        Your task is to re-write the resume content to better highlight the skills and experiences relevant to the job, AND provide a detailed critique.
        
        CRITICAL OUTPUT INSTRUCTIONS:
        - Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
        - The JSON must have this structure:
        {
            "personalInfo": { "name": "...", "contact": "..." },
            "summary": "Updated professional summary...",
            "skills": ["Skill 1", "Skill 2"...],
            "experience": [
                { "role": "...", "company": "...", "duration": "...", "points": ["tailored point 1", "tailored point 2"] }
            ],
            "education": [ ... ],
            "projects": [ ... ],
            "analysis": {
                "addedSkills": ["Skill A", "Skill B"],
                "summaryKeywords": ["keyword1", "keyword2"],
                "critique": [
                    "What specifically was weak or missing in the original resume vs this job (e.g., 'Missing Quantifiable Metrics in Role X')",
                    "Another weakness..."
                ],
                "improvements": [
                    "A specific actionable suggestion for the user (e.g., 'Add a project link for Project Y')",
                    "Another suggestion..."
                ]
            }
        }
        - "critique": Provide 3-5 distinct bullet points explaining what was wrong or missing in the original resume for THIS specific job. Be honest and direct.
        - "improvements": Provide 3-5 distinct actionable tips for the user to further improve their resume (beyond what you already fixed).
        - "addedSkills": List ONLY the skills you ADDED or emphasized.
        - If the original resume misses some sections, try to infer or keep them empty.
        
        RESUME TEXT:
        ${resumeText.slice(0, 15000)}

        JOB DESCRIPTION:
        ${jobDescription.slice(0, 15000)}
        `;

        // 4. Call Gemini API
        const apiResponse = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { 'Content-Type': 'application/json' } }
        );

        let tailoredContent = apiResponse.data.candidates[0].content.parts[0].text;
        tailoredContent = tailoredContent.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const jsonContent = JSON.parse(tailoredContent);
            res.json({ tailoredResume: jsonContent });
        } catch (e) {
            console.error("Failed to parse AI JSON:", tailoredContent);
            res.status(500).json({ error: "AI failed to generate valid structured data. Please try again." });
        }

    } catch (error) {
        console.error('Error processing request:', error);
        const errorMessage = error.response?.data?.error?.message || error.message || 'Internal Server Error';
        res.status(500).json({ error: errorMessage });
    }
});

app.post('/api/cover-letter', upload.single('resume'), async (req, res) => {
    if (!req.file || (!req.body.jobUrl && !req.body.jobText)) {
        return res.status(400).json({ error: 'Resume file and Job details are required.' });
    }

    try {
        const pdfData = await pdf(req.file.buffer);
        const resumeText = pdfData.text;
        let jobDescription = req.body.jobText || '';

        if (!jobDescription && req.body.jobUrl) {
            try {
                const response = await axios.get(req.body.jobUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                const $ = cheerio.load(response.data);
                $('script, style, nav, footer, header').remove();
                jobDescription = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 15000);
            } catch (error) {
                console.error('Job scrape failed:', error.message);
                // Fallback behavior or error handled on client
            }
        }

        const prompt = `
        You are an expert career consultant.
        JOB DESCRIPTION:
        ${jobDescription.slice(0, 10000)}

        RESUME:
        ${resumeText.slice(0, 10000)}

        TASK:
        1. Write a compelling, professional COVER LETTER (max 350 words) that connects the candidate's specific achievements to the job requirements. Keep it confident but not arrogant.
        2. Write a short, punchy LINKEDIN CONNECTION MESSAGE (max 300 chars) to send to a hiring manager/recruiter at this company.

        OUTPUT FORMAT (JSON ONLY):
        {
            "coverLetter": "Dear Hiring Manager... (full text with newlines)",
            "linkedinMessage": "Hi [Name], I recently applied for..."
        }
        `;

        const apiResponse = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { 'Content-Type': 'application/json' } }
        );

        let content = apiResponse.data.candidates[0].content.parts[0].text;
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const jsonContent = JSON.parse(content);
            res.json(jsonContent);
        } catch (e) {
            res.status(500).json({ error: "Failed to parse AI response." });
        }

    } catch (error) {
        console.error('Cover Letter Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/find-jobs', async (req, res) => {
    try {
        const { query, type } = req.body;
        // Construct the search request based on user input or defaults
        // Note: The curl provided specific params. We will try to respect those while allowing search.

        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://unstop.com/api/public/opportunity/search-result',
            params: {
                opportunity: 'jobs',
                page: '1',
                per_page: '50', // Fetching more to allow for filtering
                oppstatus: 'open',
            },
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'priority': 'u=1, i',
                'referer': 'https://unstop.com/jobs?oppstatus=open',
                'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                // Cookie is essential as per the curl
                'Cookie': 'country=IN; unLang=en; moe_uuid=8232d6eb-a7fd-4c48-9bbb-ecb1590fc1ca; allowedCookie=1; _gcl_au=1.1.1289563718.1767438995; _ga=GA1.1.2040779320.1767438996; _fbp=fb.1.1767438996093.461640882270453351; _clck=1bh1typ%5E2%5Eg2e%5E0%5E2194; moe_c_s=0; g_state={"i_l":0,"i_ll":1767439023349,"i_b":"c3WOrcAoYJWZKE7cl8VyC/CuVNixaa7CfrhncgGMI0A","i_e":{"enable_itp_optimization":0}}; COOKIE_SHARING=%7B%22actualValue%22%3Afalse%2C%22MOE_DATA_TYPE%22%3A%22boolean%22%7D; _clsk=xsglkx%5E1767439145614%5E6%5E1%5Ef.clarity.ms%2Fcollect; _ga_98GC4MBLXM=GS2.1.s1767438995^$o1^$g1^$t1767439168^$j36^$l0^$h119851682; country=US',
                'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36'
            }
        };

        const response = await axios.request(config);

        // Unstop typically returns { status: true, data: { data: [...] } }
        const jobsData = response.data?.data?.data || [];

        // DEBUG: Log the first job structure keys and specific nested objects for clarity
        if (jobsData.length > 0) {
            const firstJob = jobsData[0];
            console.log("Job Keys:", Object.keys(firstJob));
            console.log("Organisation:", JSON.stringify(firstJob.organisation, null, 2));
            console.log("JobDetail:", JSON.stringify(firstJob.jobDetail, null, 2));
        }

        const jobs = jobsData.map((job) => {
            // Location fallback
            const location = job.jobDetail?.locations?.[0] || job.job_location || 'Remote';

            // Type fallback
            const typeRaw = job.jobDetail?.timing || job.type || 'Full-time';
            const type = typeRaw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); // "full_time" -> "Full Time"

            // Salary logic
            let salary = "Competitive";
            if (job.jobDetail?.show_salary === 1 && job.jobDetail?.salary) {
                // If structure allows, otherwise keep Competitive
                // often Unstop doesn't show salary in list view openly
            }

            // Apply Link - Fix double prefix
            const relativeUrl = job.seo_url || '#';
            const applyLink = relativeUrl.startsWith('http') ? relativeUrl : `https://unstop.com/${relativeUrl}`;

            // Logo from organisation object usually
            const logo = job.organisation?.logoUrl || job.logoUrl || null;

            return {
                id: job.id,
                title: job.title,
                company: job.organisation?.name || 'Top Company',
                location: location,
                type: type,
                salary: salary,
                posted: "Recently", // Date logic could be added if 'aproved_date' exists
                applyLink: applyLink,
                logo: logo,
                tags: ["Verified", "Hiring"]
            };
        });

        const filteredJobs = jobs.filter(job => {
            if (!type || type === 'All') return true;

            const typeLower = type.toLowerCase();
            const jobTypeLower = (job.type || '').toLowerCase();
            const jobLocLower = (job.location || '').toLowerCase();

            if (type === 'Remote') {
                return jobLocLower.includes('remote') || jobTypeLower.includes('remote') || jobLocLower.includes('work from home');
            }
            if (type === 'Full-time') {
                return jobTypeLower.includes('full') || jobTypeLower.includes('permanent');
            }
            if (type === 'Contract') {
                return jobTypeLower.includes('contract') || jobTypeLower.includes('temp') || jobTypeLower.includes('intern');
            }
            return true;
        });

        res.json({ jobs: filteredJobs });

    } catch (error) {
        console.error("Unstop API Error:", error.message);
        res.status(500).json({ error: "Failed to fetch jobs", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export app for Vercel Serverless
module.exports = app;
