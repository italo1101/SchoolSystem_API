import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();


export const createTeacher = async (ctx) => {
    const password = await bcrypt.hash(ctx.request.body.password, 10);
    const { name, cpf, birth_date, schoolId } = ctx.request.body;

    const data = {
        name,
        cpf,
        birth_date: new Date(birth_date),
        password,
        schoolTeachers: {
            create: {
                school: {
                    connect: { id: schoolId },
                },
            },
        },
    };

    try {
        const teacher = await prisma.teacher.create({
            data,
            include: {
                schoolTeachers: {
                    include: {
                        school: true,
                    },
                },
            },
        });

        const { password, ...result } = teacher;
        const accessToken = generateAccessToken(teacher);

        ctx.body = { teacher: result, accessToken };
        ctx.status = 201;
    } catch (error) {
        console.error(error);
        ctx.body = { error: 'Error creating teacher' };
        ctx.status = 500;
    }
};

export const updateTeacher = async (ctx) => {
    const { id } = ctx.params;
    const password = await bcrypt.hash(ctx.request.body.password, 10);
    const { name, cpf, birth_date, schoolId } = ctx.request.body;

    const data = {
        name,
        cpf,
        birth_date: new Date(birth_date),
        password,
        schoolTeachers: {
            create: {
                school: {
                    connect: { id: schoolId },
                },
            },
        },
    };

    try {
        const updatedTeacher = await prisma.teacher.update({
            where: { id },
            data,
            include: {
                schoolTeachers: {
                    include: {
                        school: true,
                    },
                },
            },
        });

        ctx.body = updatedTeacher;
        ctx.status = 200;
    } catch (error) {
        console.error(error);
        ctx.body = { error: 'Error updating teacher' };
        ctx.status = 500;
    }
};

export const deleteTeacher = async (ctx) => {
    const { id } = ctx.params;

    try {
        await prisma.teacher.delete({
            where: { id },
        });

        ctx.body = { message: 'Teacher deleted successfully' };
        ctx.status = 200;
    } catch (error) {
        console.error(error);
        ctx.body = { error: 'Error deleting teacher' };
        ctx.status = 500;
    }
};

export const listTeachers = async (ctx) => {
    try {
        const teachers = await prisma.teacher.findMany({
            include: {
                schoolTeachers: {
                    include: {
                        school: true,
                    },
                },
            },
        });

        ctx.body = teachers;
        ctx.status = 200;
    } catch (error) {
        console.error(error);
        ctx.body = { error: 'Error listing teachers' };
        ctx.status = 500;
    }
};

export const loginTeacher = async (ctx) => {
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

        const teacher = await prisma.teacher.findUnique({
            where: { cpf },
        });

        if (!teacher) {
            ctx.status = 404;
            ctx.body = { error: 'Teacher not found' };
            return;
        }

        const passwordMatch = await bcrypt.compare(plainTextPassword, teacher.password);

        if (!passwordMatch) {
            ctx.status = 401;
            ctx.body = { error: 'Invalid credentials' };
            return;
        }

        const { password, ...result } = teacher;
        const accessToken = generateAccessToken(teacher);

        ctx.body = { teacher: result, accessToken };
        ctx.status = 200;
    } catch (error) {
        console.error(error);
        ctx.body = { error: 'Error during login' };
        ctx.status = 500;
    }
};

const generateAccessToken = (teacher) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({
        sub: teacher.id,
        name: teacher.name,
        expiresIn: '7d',
    }, process.env.JWT_SECRET);
};