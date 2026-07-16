import { Quiz } from '@/types/quiz'

export const mockQuiz: Quiz = {
  week: 1,
  title: "Week 1 Quiz",
  description: "Assessment based on Week 1 lessons",
  duration: 20,
  passMark: 70,
  totalQuestions: 5,
  totalMarks: 35,
  questions: [
    {
      number: 1,
      type: "MCQ",
      question: "Which statements accurately describe AI and automation as defined in Day 1?\ni. AI relies on human-like thinking patterns to generate responses.\nii. Automation systems require manual intervention each time they run.\niii. The combination of AI and automation enables systems to both think and execute tasks.\niv. n8n requires coding knowledge to build workflows.\n\nWhich of the statements above is/are correct?",
      options: [
        "A. i and ii only",
        "B. ii and iv only",
        "C. iii and iv only",
        "D. i and iii only"
      ]
    },
    {
      number: 2,
      type: "MCQ",
      question: "Which statements are true about building the initial 2-node workflow on Day 2?\ni. The Webhook trigger provides a unique URL that listens for incoming form submissions.\nii. Google Forms can send data directly to n8n without additional tools.\niii. The Gmail Send node uses expressions like {{ $json.name }} to personalize emails.\niv. n8n workflows cannot process form data without manual input.\n\nWhich of the statements above is/are correct?",
      options: [
        "A. i and ii",
        "B. ii and iv",
        "C. i, iii and iv",
        "D. i and iii"
      ]
    },
    {
      number: 3,
      type: "MCQ",
      question: "Which statements correctly describe the 3-node workflow implemented on Day 3?\ni. The Google Sheets Append Row node uses expressions to map Name, Email, and Gender from form data.\nii. The Timestamp column is populated using the {{ $now.toISO() }} expression.\niii. The Gender field was removed from the form to simplify the workflow.\niv. The workflow now sends emails and logs data with zero manual intervention.\n\nWhich of the statements above is/are correct?",
      options: [
        "A. i and ii only",
        "B. ii, iii and iv",
        "C. i, ii and iv",
        "D. i, iii and iv"
      ]
    },
    {
      number: 4,
      type: "Open-ended",
      question: "Scenario: A small e-commerce business owner wants to automate customer feedback collection. They plan to use Google Forms for surveys, n8n for automation, and Gmail for follow-ups.\n\nDescribe step-by-step how they should configure the workflow using n8n, including: 1) The trigger mechanism, 2) How to connect Google Forms to n8n, 3) How to personalize emails with customer names, and 4) How to log responses in Google Sheets. Explain each step using terminology from Day 2 and Day 3 lessons."
    },
    {
      number: 5,
      type: "Open-ended",
      question: "Scenario: A high school teacher wants to automate student assignment submissions. Students will submit work via Google Forms, which should automatically notify parents via Gmail and log submissions in a grade tracker spreadsheet.\n\nDesign an n8n workflow that: 1) Uses a Trigger to start the automation, 2) Sends personalized emails to parents using student names, 3) Records submission timestamps in a spreadsheet, and 4) Ensures all actions happen without manual intervention. Reference specific nodes and expressions from the lessons."
    }
  ]
}
