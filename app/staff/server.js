const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const SRM_API_URL = 'https://www.srmist.edu.in/wp-admin/admin-ajax.php';

const COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    'Referer': 'https://www.srmist.edu.in/staff-finder/',
    'Origin': 'https://www.srmist.edu.in',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Cookie': 'npfwg=1; npf_r=; npf_l=www.srmist.edu.in; npf_u=https://www.srmist.edu.in/staff-finder/',
    'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
};

// Helper function to send request to SRM
const extractDataAndSend = async (payload, res) => {
    try {
        const response = await axios.post(SRM_API_URL, payload, {
            headers: COMMON_HEADERS
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

// Endpoint 1: Filter College List
app.post('/api/filter-college', (req, res) => {
    // Expected input: { selectedCampusID, selectedCampus, security }
    // Default security if not provided: 162c2f228f
    const { selectedCampusID, selectedCampus, security } = req.body;

    const payload = new URLSearchParams();
    payload.append('selectedCampusID', selectedCampusID || '78');
    payload.append('selectedCampus', selectedCampus || '78');
    payload.append('security', security || '162c2f228f');
    payload.append('action', 'filter_college_list');

    extractDataAndSend(payload, res);
});

// Endpoint 2: Filter Department List
app.post('/api/filter-department', (req, res) => {
    // Expected input: { selectedCollegeID, selectedCollege, security }
    const { selectedCollegeID, selectedCollege, security } = req.body;

    const payload = new URLSearchParams();
    payload.append('selectedCollegeID', selectedCollegeID || '9812');
    payload.append('selectedCollege', selectedCollege || '9812');
    payload.append('security', security || '162c2f228f');
    payload.append('action', 'filter_department_list');

    // Intercept the response to save it
    (async () => {
        try {
            const response = await axios.post(SRM_API_URL, payload, {
                headers: COMMON_HEADERS
            });

            // Save to departments.json
            fs.writeFileSync(path.join(__dirname, 'departments.json'), JSON.stringify(response.data, null, 2));
            console.log('Saved departments.json');

            res.json(response.data);
        } catch (error) {
            console.error('Error fetching data:', error.message);
            if (error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    })();
});

// Helper to fetch faculty for a specific department
const fetchFacultyForDepartment = async (deptId, security) => {
    let allFaculties = [];
    let page = 1;
    const MAX_PAGE = 25;
    let stop = false;

    // Default formData template
    // campus=78&college=9812&department=<ID>&faculty=&facultyType=&designation=

    while (page <= MAX_PAGE && !stop) {
        console.log(`[Dept ${deptId}] Fetching page ${page}...`);

        const params = new URLSearchParams();
        params.append('campus', '78');
        params.append('college', '9812');
        params.append('department', deptId);
        params.append('faculty', '');
        params.append('facultyType', ''); // Removed 402 constraint
        params.append('designation', '');
        const formDataString = params.toString();

        const payload = new URLSearchParams();
        payload.append('page', page.toString());
        payload.append('formData', formDataString);
        payload.append('security', security || '162c2f228f');
        payload.append('action', 'list_faculties_default');

        try {
            const response = await axios.post(SRM_API_URL, payload, {
                headers: COMMON_HEADERS
            });

            const $ = cheerio.load(response.data);
            const pageFaculties = [];
            let foundOnPage = 0;

            $('.staff-card').each((index, element) => {
                const nameElement = $(element).find('.post-title a');
                const designation = $(element).find('.designation').text().trim();
                const specialization = $(element).find('.specialization_area').text().trim();
                const link = nameElement.attr('href');
                const name = nameElement.text().trim();

                if (name && link) {
                    pageFaculties.push({
                        name: name,
                        link: link,
                        designation: designation,
                        specialization: specialization
                    });
                    foundOnPage++;
                }
            });

            if (foundOnPage === 0) {
                console.log(`[Dept ${deptId}] No faculties found on page ${page}. Stopping.`);
                stop = true;
            } else {
                console.log(`[Dept ${deptId}] Found ${foundOnPage} faculties on page ${page}.`);
                allFaculties = allFaculties.concat(pageFaculties);
                page++;
            }
        } catch (error) {
            console.error(`[Dept ${deptId}] Error on page ${page}:`, error.message);
            stop = true;
        }
    }
    return allFaculties;
};

// Endpoint 3: List Faculties (Single Department from Payload)
app.post('/api/list-faculties', async (req, res) => {
    const { formData, security } = req.body;

    // Attempt to extract department ID from formData string or object
    let deptId = '13537'; // Default to Data Science if parsing fails
    if (typeof formData === 'string') {
        const match = formData.match(/department=(\d+)/);
        if (match) deptId = match[1];
    } else if (typeof formData === 'object' && formData.department) {
        deptId = formData.department;
    }

    const faculties = await fetchFacultyForDepartment(deptId, security);

    const jsonResponse = { faculties: faculties };
    if (faculties.length === 0) jsonResponse.debug_message = "No faculties found.";

    fs.writeFileSync(path.join(__dirname, 'faculties.json'), JSON.stringify(jsonResponse, null, 2));
    console.log(`Saved ${faculties.length} faculties to faculties.json`);
    res.json(jsonResponse);
});

// Endpoint 4: Fetch All Target Departments
app.post('/api/fetch-all-target-departments', async (req, res) => {
    const { security } = req.body;
    const targetDeptIds = ['13537', '13534', '13519', '13522']; // Data Science, Comp Intel, Comp Tech, Networking
    const results = {};

    for (const deptId of targetDeptIds) {
        console.log(`\n--- Processing Department ${deptId} ---`);
        const faculties = await fetchFacultyForDepartment(deptId, security);
        const filename = `faculty_${deptId}.json`;

        fs.writeFileSync(path.join(__dirname, filename), JSON.stringify({ faculties }, null, 2));
        console.log(`Saved ${filename}`);
        results[deptId] = { count: faculties.length, file: filename };
    }

    res.json({ message: "Batch fetch completed", results });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
