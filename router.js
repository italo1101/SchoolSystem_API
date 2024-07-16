import Router from '@koa/router'
import { createAdm, listAdms, updateAdm, deleteAdm, loginAdm } from './app/users/adm_controller/index.js';
import { createStudent, updateStudent, deleteStudent, listStudents, loginStudent } from './app/users/student_controller/index.js';
import { createTeacher, updateTeacher, deleteTeacher, listTeachers, loginTeacher } from './app/users/teacher_controller/index.js';
import { createSchool, updateSchool, deleteSchool, listSchools, isAdmin } from './app/schools/index.js';

export const router = new Router()

router.post('/adms', createAdm);
router.put('/adms/:id', updateAdm);
router.delete('/adms/:id', deleteAdm);
router.get('/adms', listAdms);
router.post('/adm/login', loginAdm);

router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.get('/students', listStudents);
router.post('/students/login', loginStudent);

router.post('/teachers', createTeacher);
router.put('/teachers/:id', updateTeacher);
router.delete('/teachers/:id', deleteTeacher);
router.get('/teachers', listTeachers);
router.post('/teachers/login', loginTeacher);

router.post('/schools', isAdmin, createSchool); 
router.put('/schools/:id', isAdmin, updateSchool);
router.delete('/schools/:id', isAdmin, deleteSchool); 
router.get('/schools', listSchools);
