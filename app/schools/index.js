import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();


export const isAdmin = async (ctx, next) => {
    try {
        const token = ctx.header.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.adm.findUnique({ where: { id: decoded.sub } });

        if (!user) {
            ctx.status = 403;
            ctx.body = { error: 'Access denied' };
            return;
        }

        await next();
    } catch (error) {
        ctx.status = 403;
        ctx.body = { error: 'Access denied' };
    }
};


export const createSchool = async (ctx) => {
    const { name, street, district, number } = ctx.request.body;

    try {
        const school = await prisma.school.create({
            data: {
                name,
                street,
                district,
                number,
            },
        });

        ctx.body = school;
        ctx.status = 201;
    } catch (error) {
        ctx.body = error;
        ctx.status = 500;
    }
};


export const updateSchool = async (ctx) => {
    const { id } = ctx.params;
    const { name, street, district, number } = ctx.request.body;

    try {
        const updatedSchool = await prisma.school.update({
            where: { id },
            data: {
                name,
                street,
                district,
                number,
            },
        });

        ctx.body = updatedSchool;
        ctx.status = 200;
    } catch (error) {
        ctx.body = error;
        ctx.status = 500;
    }
};


export const deleteSchool = async (ctx) => {
    const { id } = ctx.params;

    try {
        await prisma.school.delete({
            where: { id },
        });

        ctx.body = { message: 'School deleted successfully' };
        ctx.status = 200;
    } catch (error) {
        ctx.body = error;
        ctx.status = 500;
    }
};


export const listSchools = async (ctx) => {
    try {
        const schools = await prisma.school.findMany();

        ctx.body = schools;
        ctx.status = 200;
    } catch (error) {
        ctx.body = error;
        ctx.status = 500;
    }
};
