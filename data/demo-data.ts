import { ApiResponse } from "@/types/academia";

export const DEMO_DATA: ApiResponse = {
    status: "success",
    attendance: {
        student_info: {
            name: "JOHN DOE",
            registration_number: "RA2111003010001",
            program: "B.Tech",
            department: "Computer Science and Engineering",
            specialization: "Software Engineering",
            semester: "5",
            enrollment_status: "Active",
            enrollment_date: "2021-07-15",
            //   batch: "1", // Handled in timetable.student_info
            //   photo_url: "https://example.com/photo.jpg" 
        },
        attendance: {
            overall_attendance: 85.5,
            total_hours_conducted: 120,
            total_hours_absent: 18,
            courses: {
                "18CSC303JProfessional Core": {
                    course_title: "Database Management Systems",
                    total_hours_conducted: 30, // Mapped from hours_conducted
                    total_hours_absent: 2,    // Mapped from hours_absent
                    attendance_percentage: 93.33
                },
                "18MAB301TBasic Science": {
                    course_title: "Probability and Statistics",
                    total_hours_conducted: 25,
                    total_hours_absent: 5,
                    attendance_percentage: 80.0
                }
            }
        },
        marks: {
            "18CSC303JTheory": {
                course_type: "Theory",
                tests: [
                    {
                        test_name: "Cycle Test - 1",
                        obtained_marks: 9.5,
                        max_marks: 10.0,
                        percentage: 95.0
                    },
                    {
                        test_name: "Cycle Test - 2",
                        obtained_marks: 13.0,
                        max_marks: 15.0,
                        percentage: 86.67
                    }
                ]
            },
            "18CSC303JPractical": {
                course_type: "Practical",
                tests: [
                    {
                        test_name: "Exp 1",
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
            registration_number: "RA2111003010001",
            name: "JOHN DOE",
            batch: "1",
            mobile: "9876543210",
            program: "B.Tech",
            department: "CSE",
            semester: "5",
            //   specialization: "Software Engineering" // Optional
        },
        total_credits: 21,
        courses: [
            {
                s_no: "1",
                course_code: "18CSC303J",
                course_title: "Database Management Systems",
                credit: 4,
                regn_type: "Regular",
                category: "Professional Core",
                course_type: "Integrated",
                faculty_name: "Dr. Smith",
                slot: "A",
                room_no: "UB101",
                academic_year: "2023-24-ODD"
            },
            {
                s_no: "2",
                course_code: "18MAB301T",
                course_title: "Probability and Statistics",
                credit: 4,
                regn_type: "Regular",
                category: "Basic Science",
                course_type: "Theory",
                faculty_name: "Dr.Raman",
                slot: "C",
                room_no: "UB204",
                academic_year: "2023-24-ODD"
            }
        ],
        advisors: {
            faculty_advisor: {
                name: "Prof. Praveen",
                email: "Praveen@srmist.edu.in",
                phone: "9988776655"
            },
            academic_advisor: {
                name: "Prof. Severus",
                email: "severus@srmist.edu.in",
                phone: "1122334455"
            }
        }
    },
    logout_status: "success"
};
