import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as c from './auth.controller';
import { authMiddleware } from '../../middlewares/auth';
import { csrfProtection } from '../../middlewares/csrf';

const router = Router();

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	skipSuccessfulRequests: true,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Muitas tentativas de login. Tente novamente mais tarde.' },
});

const registerLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Muitas tentativas de registro. Tente novamente mais tarde.' },
});

const refreshLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Muitas tentativas de renovação de sessão. Tente novamente mais tarde.' },
});

const activationLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Muitas tentativas de ativação. Tente novamente mais tarde.' },
});

router.post('/register', registerLimiter, c.register);
router.post('/login', loginLimiter, c.login);
router.post('/refresh', refreshLimiter, csrfProtection, c.refreshSession);
router.post('/logout', csrfProtection, c.logout);
router.get('/me', authMiddleware, c.me);
router.post('/addresses', authMiddleware, csrfProtection, c.createAddress);
router.put('/addresses/:id', authMiddleware, csrfProtection, c.updateAddress);
router.post('/addresses/:id/select', authMiddleware, csrfProtection, c.selectAddress);
router.delete('/addresses/:id', authMiddleware, csrfProtection, c.deleteAddress);
router.get('/activate/:token', activationLimiter, c.activate);

export default router;
