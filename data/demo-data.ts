import { ApiResponse } from "@/types/academia";

export const DEMO_DATA: ApiResponse = {
  status: "success",
  attendance: {
    student_info: {
      name: "Student",
      registration_number: "REG123456789",
      program: "B.Tech",
      department: "Department",
      specialization: "Specialization",
      semester: "4",
      enrollment_status: "Active",
      enrollment_date: "2021-07-15"
    },
    attendance: {
      overall_attendance: 85.5,
      total_hours_conducted: 120,
      total_hours_absent: 18,
      courses: {
        "SUBJECT1": {
          course_title: "Subject 1",
          total_hours_conducted: 30,
          total_hours_absent: 2,
          attendance_percentage: 93.33
        },
        "SUBJECT2": {
          course_title: "Subject 2",
          total_hours_conducted: 25,
          total_hours_absent: 5,
          attendance_percentage: 80.0
        }
      }
    },
    marks: {
      "SUBJECT1Theory": {
        course_type: "Theory",
        tests: [
          {
            test_name: "Test 1",
            obtained_marks: 9.5,
            max_marks: 10.0,
            percentage: 95.0
          },
          {
            test_name: "Test 2",
            obtained_marks: 13.0,
            max_marks: 15.0,
            percentage: 86.67
          }
        ]
      },
      "SUBJECT1Practical": {
        course_type: "Practical",
        tests: [
          {
            test_name: "Practical 1",
            obtained_marks: 90.0,
            max_marks: 100.0,
            percentage: 90.0
          }
        ]
      }
    },
    summary: {},
    day_order: 3
  },
  timetable: {
    student_info: {
      registration_number: "REG123456789",
      name: "Student",
      batch: "Batch 1",
      mobile: "9000000000",
      program: "B.Tech",
      department: "Department",
      semester: "5"
    },
    total_credits: 21,
    courses: [
      {
        s_no: "1",
        course_code: "SUBJ101",
        course_title: "Subject 1",
        credit: 4,
        regn_type: "Regular",
        category: "Category 1",
        course_type: "Theory",
        faculty_name: "Faculty",
        slot: "A",
        room_no: "Room 101",
        academic_year: "2023-24"
      },
      {
        s_no: "2",
        course_code: "SUBJ102",
        course_title: "Subject 2",
        credit: 4,
        regn_type: "Regular",
        category: "Category 2",
        course_type: "Theory",
        faculty_name: "Faculty",
        slot: "B",
        room_no: "Room 202",
        academic_year: "2023-24"
      }
    ],
    advisors: {
      faculty_advisor: {
        name: "Faculty Advisor",
        email: "faculty.advisor@example.com",
        phone: "9000000001"
      },
      academic_advisor: {
        name: "Academic Advisor",
        email: "academic.advisor@example.com",
        phone: "9000000002"
      }
    }
  },
  logout_status: "success"
};
