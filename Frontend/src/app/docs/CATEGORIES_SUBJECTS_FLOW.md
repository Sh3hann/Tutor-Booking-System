# Subject & Category Management Flow

## Overview

The tuition system is **subject-based**. Tutors are grouped under subject categories (Primary, O/L, A/L → Streams → Subjects). Students filter tutors by Category → Stream → Subject → Grade.

---

## 1. Subject Management

**Components:** `TutorAddSubjects.tsx`, `TutorProfileNew.tsx`  
**Route:** `/tutor/add-subjects`, `/tutor/profile`  
**Data:** `src/app/data/subjects.ts`

- Tutors manage which subjects they teach (Maths, Science, ICT, etc.)
- Uses **Grade Level / Category** dropdown (Grade 1–13, O/L, A/L) + **Subject** dropdown
- Each subject can have teaching mediums (English, Sinhala, Tamil)
- Subject chips/tags displayed for selected subjects

---

## 2. Category/Stream Grouping

**Component:** `TutorCategories.tsx`  
**Route:** `/tutor/categories`  
**Data:** `src/app/data/subjects.ts` (`SUBJECT_CATEGORIES`, `SUBJECTS_BY_CATEGORY`)

- **Categories** = Grade levels / streams: Primary (Grade 1–5), Middle (Grade 6–10), O/L, A/L
- **Streams** = Same as categories (Grade 1–13, O/L, A/L)
- **Subjects** = Chips under each category (e.g. Mathematics, Science, ICT)
- Displays cards per category with subject tags
- Accessed from dashboard: **Categories & Subjects** card → **View Categories**

---

## 3. Student Filtering

**Component:** `SearchTutors.tsx`  
**Route:** `/student/search`

- Students filter tutors: **Category** (Grade/Stream) → **Subject** → Medium, Class Type, Class Format
- Uses same `SUBJECT_CATEGORIES` and `SUBJECTS_BY_CATEGORY` data
- Search API: `searchAPI.searchTutors(category, subject, medium, classType, classFormat)`
- Results show tutor cards with subject badges

---

## Dashboard Entry Point

**Route:** `http://localhost:5173/tutor/dashboard`

- Card: **Categories & Subjects**
- Description: Browse streams and subjects
- Button: **View Categories** → navigates to `/tutor/categories`

---

## Data Flow

```
subjects.ts (single source of truth)
    ├── SUBJECT_CATEGORIES (Grade 1–13, O/L, A/L)
    └── SUBJECTS_BY_CATEGORY (subjects per category)

    → TutorCategories (browse UI)
    → TutorAddSubjects (tutor assigns subjects)
    → SearchTutors (student filters)
```
