// types/academia.ts
export interface StudentInfo {
  registration_number: string;
  name: string;
  program: string;
  department: string;
  specialization?: string;
  semester: string;
  enrollment_status?: string;
  enrollment_date?: string;
  batch?: string;
  mobile?: string;
}

export interface Test {
  test_name: string;
  obtained_marks: number;
  max_marks: number;
  percentage: number;
}

export interface CourseMarks {
  course_type: string;
  tests: Test[];
}

export interface AttendanceCourses {
  [courseCode: string]: {
    course_title: string;
    total_hours_conducted: number;
    total_hours_absent: number;
    attendance_percentage: number;
  };
}

export interface AttendanceData {
  student_info: StudentInfo;
  attendance: {
    courses: AttendanceCourses | {};
    overall_attendance: number;
    total_hours_conducted: number;
    total_hours_absent: number;
  };
  marks: {
    [courseCode: string]: CourseMarks;
  };
  summary: Record<string, unknown>;
  day_order: number;
}

export interface TimetableCourse {
  s_no: string;
  course_code: string;
  course_title: string;
  credit: number;
  regn_type: string;
  category: string;
  course_type: string;
  faculty_name: string;
  slot: string;
  room_no: string;
  academic_year: string;
}

export interface Advisors {
  faculty_advisor: {
    name: string;
    email: string;
    phone: string;
  };
  academic_advisor: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface TimetableData {
  student_info: StudentInfo & {
    batch: string;
    mobile: string;
  };
  courses: TimetableCourse[];
  advisors: Advisors;
  total_credits: number;
}

export interface ApiResponse {
  status: string;
  attendance: AttendanceData;
  timetable: TimetableData;
  logout_status: string;
}
