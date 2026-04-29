import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROLES_DIR = path.join(__dirname, '..');
const ADMIN_DIR = path.join(ROLES_DIR, 'data', 'admin');
const STUDENT_DIR = path.join(ROLES_DIR, 'data', 'student');
const TUTOR_DIR = path.join(ROLES_DIR, 'data', 'tutor');

/**
 * Initialize role-based directories
 */
export async function initializeRoleDirectories() {
  try {
    await fs.mkdir(ADMIN_DIR, { recursive: true });
    await fs.mkdir(STUDENT_DIR, { recursive: true });
    await fs.mkdir(TUTOR_DIR, { recursive: true });
    console.log('✓ Role-based directories initialized');
  } catch (err) {
    console.error('Failed to initialize directories:', err.message);
  }
}

/**
 * Organize users into role-based JSON files
 * @param {Array} users - Array of user objects
 */
export async function organizeUsersByRole(users) {
  try {
    // Separate users by role
    const adminUsers = users.filter((u) => u.role === 'admin');
    const studentUsers = users.filter((u) => u.role === 'student');
    const tutorUsers = users.filter((u) => u.role === 'tutor' || u.role === 'tutor_pending' || u.role === 'institute_manager');

    // Save to respective files
    await fs.writeFile(path.join(ADMIN_DIR, 'users.json'), JSON.stringify(adminUsers, null, 2), 'utf-8');
    await fs.writeFile(path.join(STUDENT_DIR, 'users.json'), JSON.stringify(studentUsers, null, 2), 'utf-8');
    await fs.writeFile(path.join(TUTOR_DIR, 'users.json'), JSON.stringify(tutorUsers, null, 2), 'utf-8');

    console.log(`✓ Users organized by role: ${adminUsers.length} admin, ${studentUsers.length} student, ${tutorUsers.length} tutor`);
  } catch (err) {
    console.error('Failed to organize users by role:', err.message);
  }
}

/**
 * Get all users from role-based files
 */
export async function getAllUsersFromRoleFiles() {
  try {
    const adminFile = path.join(ADMIN_DIR, 'users.json');
    const studentFile = path.join(STUDENT_DIR, 'users.json');
    const tutorFile = path.join(TUTOR_DIR, 'users.json');

    const adminUsers = await fileExists(adminFile) ? JSON.parse(await fs.readFile(adminFile, 'utf-8')) : [];
    const studentUsers = await fileExists(studentFile) ? JSON.parse(await fs.readFile(studentFile, 'utf-8')) : [];
    const tutorUsers = await fileExists(tutorFile) ? JSON.parse(await fs.readFile(tutorFile, 'utf-8')) : [];

    return [...adminUsers, ...studentUsers, ...tutorUsers];
  } catch (err) {
    console.error('Failed to read users from role files:', err.message);
    return [];
  }
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get users by specific role from files
 */
export async function getUsersByRoleFromFile(role) {
  try {
    const roleMap = {
      admin: path.join(ADMIN_DIR, 'users.json'),
      student: path.join(STUDENT_DIR, 'users.json'),
      tutor: path.join(TUTOR_DIR, 'users.json'),
    };

    const file = roleMap[role.toLowerCase()];
    if (!file) return [];

    if (await fileExists(file)) {
      const content = await fs.readFile(file, 'utf-8');
      return JSON.parse(content);
    }
    return [];
  } catch (err) {
    console.error(`Failed to read ${role} users from file:`, err.message);
    return [];
  }
}

/**
 * Export user data summary
 */
export async function exportUserSummary() {
  try {
    const summary = {
      timestamp: new Date().toISOString(),
      admins: await getUsersByRoleFromFile('admin'),
      students: await getUsersByRoleFromFile('student'),
      tutors: await getUsersByRoleFromFile('tutor'),
    };

    const summaryFile = path.join(ROLES_DIR, 'data', 'users-summary.json');
    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2), 'utf-8');
    console.log('✓ User summary exported to users-summary.json');
    return summary;
  } catch (err) {
    console.error('Failed to export user summary:', err.message);
  }
}
