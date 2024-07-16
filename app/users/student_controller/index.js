import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const createStudent = async (ctx) => {
    const password = await bcrypt.hash(ctx.request.body.password, 10);
    const { name, cpf, birth_date, fk_school_id, teacherIds } = ctx.request.body;

    try {
        const student = await prisma.student.create({
            data: {
                name,
                cpf,
                birth_date: new Date(birth_date),
                password,
                fk_school_id,
                teacherStudents: {
                    create: teacherIds.map(teacherId => ({
                        teacher: { connect: { id: teacherId } }
                    }))
                }
            },
            include: {
                teacherStudents: {
                    include: {
                        teacher: true
                    }
                }
            }
        });

        const formattedStudent = {
            ...student,
            teacherIds: student.teacherStudents.map(ts => ts.teacher.id)
        };

        ctx.body = formattedStudent;
        ctx.status = 201;
    } catch (error) {
        ctx.body = error;
        ctx.status = 500;
    }
};


export const listStudents = async (ctx) => {
    try {
        const students = await prisma.student.findMany({
            include: {
                school: true,
                teacherStudents: {
                    include: {
                        teacher: true
                    }
                }
            }
        });
        ctx.body = students;
        ctx.status = 200;
    } catch (error) {
        ctx.body = error;
        ctx.status = 500;
    }
};


export const updateStudent = async (ctx) => {
    const { id } = ctx.params;
    const password = await bcrypt.hash(ctx.request.body.password, 10);
    const { name, cpf, birth_date, fk_school_id, teacherIds } = ctx.request.body;

    try {
        const updatedStudent = await prisma.student.update({
            where: { id },
            data: {
                name,
                cpf,
                birth_date: new Date(birth_date),
                password,
                fk_school_id,
                teacherStudents: {
                    deleteMany: {},
                    create: teacherIds.map(teacherId => ({
                        teacher: { connect: { id: teacherId } }
                    }))
                }
            },
            include: {
                school: true,
                teacherStudents: {
                    include: {
                        teacher: true
                    }
                }
            }
        });

        ctx.body = updatedStudent;
        ctx.status = 200;
    } catch (error) {
        ctx.body = error;
        ctx.status = 500;
    }
};


export const deleteStudent = async (ctx) => {
    const { id } = ctx.params;

    try {
        await prisma.student.delete({
            where: { id },
        });

        ctx.body = { message: 'Estudante excluído com sucesso' };
        ctx.status = 200;
    } catch (error) {
        ctx.body = error;
        ctx.status = 500;
    }
};


export const loginStudent = async (ctx) => {
    try {
        const [type, token] = ctx.header.authorization.split(' ');
        if (type !== 'Basic') {
            ctx.status = 400;
            ctx.body = { error: 'Invalid authorization type' };
            return;
        }

        const decodedToken = Buffer.from(token, 'base64').toString();
        const [cpf, plainTextPassword] = decodedToken.split(':');

        if (!cpf || !plainTextPassword) {
            ctx.status = 400;
            ctx.body = { error: 'Invalid authorization format' };
            return;
        }

        const student = await prisma.student.findUnique({
            where: { cpf },
        });

        if (!student) {
            ctx.status = 404;
            ctx.body = { error: 'Student not found' };
            return;
        }

        const passwordMatch = await bcrypt.compare(plainTextPassword, student.password);

        if (!passwordMatch) {
            ctx.status = 401;
            ctx.body = { error: 'Invalid credentials' };
            return;
        }

        const { password, ...result } = student;
        const accessToken = generateAccessToken(student);

        ctx.body = { student: result, accessToken };
        ctx.status = 200;
    } catch (error) {
        console.error(error);
        ctx.body = { error: 'Error during login' };
        ctx.status = 500;
    }
};

const generateAccessToken = (student) => {
  if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({
      sub: student.id,
      name: student.name,
      expiresIn: '7d',
  }, process.env.JWT_SECRET);
};