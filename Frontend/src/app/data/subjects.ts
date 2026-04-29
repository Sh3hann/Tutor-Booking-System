/**
 * Single source of truth for Category/Stream/Subject hierarchy.
 * Used by: TutorCategories (browse), TutorAddSubjects (tutor assigns), SearchTutors (student filters).
 */
export const SUBJECT_CATEGORIES = [
  { value: 'grade-1', label: 'Grade 1' },
  { value: 'grade-2', label: 'Grade 2' },
  { value: 'grade-3', label: 'Grade 3' },
  { value: 'grade-4', label: 'Grade 4' },
  { value: 'grade-5', label: 'Grade 5' },
  { value: 'grade-6', label: 'Grade 6' },
  { value: 'grade-7', label: 'Grade 7' },
  { value: 'grade-8', label: 'Grade 8' },
  { value: 'grade-9', label: 'Grade 9' },
  { value: 'grade-10', label: 'Grade 10' },
  { value: 'ol', label: 'O/L (Ordinary Level)' },
  { value: 'al', label: 'A/L (Advanced Level)' },
];

export const MEDIUMS = [
  { value: 'english', label: 'English' },
  { value: 'sinhala', label: 'Sinhala' },
  { value: 'tamil', label: 'Tamil' },
];

export const CLASS_TYPES = [
  { value: 'online', label: 'Online' },
  { value: 'physical', label: 'Physical' },
];

export const CLASS_FORMATS = [
  { value: 'individual', label: 'Individual (1-on-1)' },
  { value: 'group', label: 'Group Class' },
];

export const SUBJECTS_BY_CATEGORY: Record<string, string[]> = {
  'grade-1': ['Mathematics', 'English', 'Sinhala', 'Tamil', 'Environment Studies'],
  'grade-2': ['Mathematics', 'English', 'Sinhala', 'Tamil', 'Environment Studies'],
  'grade-3': ['Mathematics', 'English', 'Sinhala', 'Tamil', 'Environment Studies'],
  'grade-4': ['Mathematics', 'English', 'Sinhala', 'Tamil', 'Environment Studies'],
  'grade-5': ['Mathematics', 'English', 'Sinhala', 'Tamil', 'Science', 'Social Studies'],
  'grade-6': ['Mathematics', 'English', 'Sinhala', 'Tamil', 'Science', 'History', 'Geography', 'Buddhism', 'Christianity', 'Hinduism', 'Islam'],
  'grade-7': ['Mathematics', 'English', 'Sinhala', 'Tamil', 'Science', 'History', 'Geography', 'Buddhism', 'Christianity', 'Hinduism', 'Islam'],
  'grade-8': ['Mathematics', 'English', 'Sinhala', 'Tamil', 'Science', 'History', 'Geography', 'Buddhism', 'Christianity', 'Hinduism', 'Islam'],
  'grade-9': ['Mathematics', 'English', 'Sinhala', 'Tamil', 'Science', 'History', 'Geography', 'Buddhism', 'Christianity', 'Hinduism', 'Islam'],
  'grade-10': ['Mathematics', 'English', 'Sinhala', 'Tamil', 'Science', 'History', 'Geography', 'Buddhism', 'Christianity', 'Hinduism', 'Islam', 'Commerce', 'ICT'],
  'ol': ['Mathematics', 'Science', 'English', 'Sinhala', 'Tamil', 'History', 'Geography', 'Buddhism', 'Christianity', 'Hinduism', 'Islam', 'Commerce', 'ICT'],
  'al': ['Combined Mathematics', 'Physics', 'Chemistry', 'Biology', 'Accounting', 'Business Studies', 'Economics', 'ICT', 'Geography', 'History', 'English', 'Sinhala Literature', 'Tamil Literature'],
};