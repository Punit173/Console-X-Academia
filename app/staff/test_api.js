const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testEndpoints() {
    try {
        console.log('Testing /filter-college...');
        const collegeRes = await axios.post(`${BASE_URL}/filter-college`, {
            selectedCampusID: '78',
            selectedCampus: '78',
            security: '162c2f228f'
        });
        console.log('College Response Status:', collegeRes.status);
        console.log('College Data Preview:', JSON.stringify(collegeRes.data).substring(0, 100));

        console.log('\nTesting /filter-department...');
        const deptRes = await axios.post(`${BASE_URL}/filter-department`, {
            selectedCollegeID: '9812',
            selectedCollege: '9812',
            security: '162c2f228f'
        });
        console.log('Department Response Status:', deptRes.status);
        console.log('Department Data Preview:', JSON.stringify(deptRes.data).substring(0, 100));

        console.log('\nTesting /list-faculties...');
        const facultyRes = await axios.post(`${BASE_URL}/list-faculties`, {
            page: '1',
            formData: 'campus=78&college=9812&department=13537&faculty=&facultyType=&designation=',
            security: '162c2f228f'
        });
        console.log('Faculty Response Status:', facultyRes.status);
        console.log('Faculty Data Preview:', JSON.stringify(facultyRes.data).substring(0, 100));

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
        }
    }
}

testEndpoints();
