import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();


export const createAdm = async (ctx) => {
    const password = await bcrypt.hash(ctx.request.body.password, 10);
    const { name, cpf, birth_date } = ctx.request.body;
    
    try {
        const adm = await prisma.adm.create({
            data: {
                name,
                cpf,
                birth_date: new Date(birth_date),
                password,
            },
        });

        ctx.body = adm;
        ctx.status = 201;
    } catch (error) {
        ctx.body = error;
        ctx.status = 500;
    }
};


export const listAdms = async (ctx) => {
    try {
        const adms = await prisma.adm.findMany();
        ctx.body = adms;
        ctx.status = 200;
    } catch (error) {
        ctx.body = error;
        ctx.status = 500;
    }
};


export const updateAdm = async (ctx) => {
    const { id } = ctx.params;
    const password = await bcrypt.hash(ctx.request.body.password, 10);
    const { name, cpf, birth_date } = ctx.request.body;
    
    try {
        const updatedAdm = await prisma.adm.update({
            where: { id },
            data: {
                name,
                cpf,
                birth_date: new Date(birth_date),
                password,
            },
        });
        
        ctx.body = updatedAdm;
        ctx.status = 200;
    } catch (error) {
        ctx.body = error;
        ctx.status = 500;
    }
};


export const deleteAdm = async (ctx) => {
    const { id } = ctx.params;
    
    try {
        await prisma.adm.delete({
            where: { id },
        });
        
        ctx.body = { message: 'Adm deleted successfully' };
        ctx.status = 200;
    } catch (error) {
        ctx.body = error;
        ctx.status = 500;
    }
};


export const loginAdm = async (ctx) => {
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
        
        const adm = await prisma.adm.findUnique({
            where: { cpf },
        });
        
        if (!adm) {
            ctx.status = 404;
            ctx.body = { error: 'Adm not found' };
            return;
        }

        const passwordMatch = await bcrypt.compare(plainTextPassword, adm.password);
        
        if (!passwordMatch) {
            ctx.status = 401;
            ctx.body = { error: 'Invalid credentials' };
            return;
        }
        
        const { password, ...result } = adm;
        const accessToken = generateAccessToken(adm);
        
        ctx.body = { adm: result, accessToken };
        ctx.status = 200;
    } catch (error) {
        console.error(error);
        ctx.body = { error: 'Error during login' };
        ctx.status = 500;
    }
};

const generateAccessToken = (adm) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({
        sub: adm.id,
        name: adm.name,
        expiresIn: '7d',
    }, process.env.JWT_SECRET);
};
