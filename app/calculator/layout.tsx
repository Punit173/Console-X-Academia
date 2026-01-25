import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "SRM CGPA Calculator | Console X Academia",
    description: "Calculate your SRMIST CGPA and SGPA instantly. Predict your future grades and track academic performance with the Console X GPA Calculator.",
    keywords: ["CGPA Calculator", "SRM CGPA", "SGPA Calculator", "SRMIST Grading", "Grade Predictor"],
    openGraph: {
        title: "SRM CGPA Calculator | Fast & Accurate",
        description: "Calculate or predict your SRM CGPA instantly. Try the best GPA calculator for SRMIST students.",
        url: "https://console-x-academia.vercel.app/calculator",
    }
};

export default function CalculatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
