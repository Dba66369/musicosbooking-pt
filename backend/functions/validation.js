// backend/functions/validation.js - Validação Server-Side
// SEMANA 2.4 - Validação robusta de todos os inputs

/**
 * VALIDAÇÃO COMPLETA DE INPUTS
 * Todas as funções retornam { valid: boolean, error?: string }
 */

const validation = {
    /**
     * Valida email
     */
    email: (email) => {
        if (!email || typeof email !== 'string') {
            return { valid: false, error: 'Email é obrigatório' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, error: 'Email inválido' };
        }

        if (email.length > 254) {
            return { valid: false, error: 'Email demasiado longo' };
        }

        return { valid: true };
    },

    /**
     * Valida password
     */
    password: (password) => {
        if (!password || typeof password !== 'string') {
            return { valid: false, error: 'Password é obrigatória' };
        }

        if (password.length < 6) {
            return { valid: false, error: 'Password deve ter pelo menos 6 caracteres' };
        }

        if (password.length > 128) {
            return { valid: false, error: 'Password demasiado longa' };
        }

        // Verifica se tem pelo menos uma letra e um número
        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
            return { valid: false, error: 'Password deve conter letras e números' };
        }

        return { valid: true };
    },

    /**
     * Valida nome
     */
    nome: (nome, minLen = 3, maxLen = 100) => {
        if (!nome || typeof nome !== 'string') {
            return { valid: false, error: 'Nome é obrigatório' };
        }

        const trimmed = nome.trim();

        if (trimmed.length < minLen) {
            return { valid: false, error: `Nome deve ter pelo menos ${minLen} caracteres` };
        }

        if (trimmed.length > maxLen) {
            return { valid: false, error: `Nome não pode exceder ${maxLen} caracteres` };
        }

        // Permite apenas letras, espaços, hífens e apóstrofos
        if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed)) {
            return { valid: false, error: 'Nome contém caracteres inválidos' };
        }

        return { valid: true };
    },

    /**
     * Valida telemóvel português
     */
    telefone: (telefone) => {
        if (!telefone || typeof telefone !== 'string') {
            return { valid: false, error: 'Telefone é obrigatório' };
        }

        // Remove espaços e outros caracteres
        const cleaned = telefone.replace(/[\s()-]/g, '');

        // Aceita: +351..., 351..., 9xxxxxxxx, 2xxxxxxxx
        const patterns = [
            /^\+351[0-9]{9}$/,
            /^351[0-9]{9}$/,
            /^[92][0-9]{8}$/
        ];

        const isValid = patterns.some(pattern => pattern.test(cleaned));

        if (!isValid) {
            return { valid: false, error: 'Número de telefone português inválido' };
        }

        return { valid: true };
    },

    /**
     * Valida NIF português
     */
    nif: (nif) => {
        if (!nif) {
            return { valid: false, error: 'NIF é obrigatório' };
        }

        const cleaned = nif.toString().replace(/\s/g, '');

        if (!/^[0-9]{9}$/.test(cleaned)) {
            return { valid: false, error: 'NIF deve ter 9 dígitos' };
        }

        // Algoritmo de validação do NIF
        const digits = cleaned.split('').map(Number);
        const checkDigit = digits[8];
        const sum = digits.slice(0, 8).reduce((acc, digit, i) => acc + digit * (9 - i), 0);
        const calculatedCheck = 11 - (sum % 11);
        const expectedCheck = calculatedCheck >= 10 ? 0 : calculatedCheck;

        if (checkDigit !== expectedCheck) {
            return { valid: false, error: 'NIF inválido' };
        }

        return { valid: true };
    },

    /**
     * Valida IBAN
     */
    iban: (iban) => {
        if (!iban || typeof iban !== 'string') {
            return { valid: false, error: 'IBAN é obrigatório' };
        }

        const cleaned = iban.replace(/\s/g, '').toUpperCase();

        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleaned)) {
            return { valid: false, error: 'Formato de IBAN inválido' };
        }

        if (cleaned.length < 15 || cleaned.length > 34) {
            return { valid: false, error: 'Comprimento de IBAN inválido' };
        }

        return { valid: true };
    },

    /**
     * Valida valor monetário
     */
    valor: (valor, min = 0, max = 1000000) => {
        const num = parseFloat(valor);

        if (isNaN(num)) {
            return { valid: false, error: 'Valor inválido' };
        }

        if (num < min) {
            return { valid: false, error: `Valor mínimo é €${min}` };
        }

        if (num > max) {
            return { valid: false, error: `Valor máximo é €${max}` };
        }

        return { valid: true };
    },

    /**
     * Valida data
     */
    data: (data) => {
        if (!data) {
            return { valid: false, error: 'Data é obrigatória' };
        }

        const date = new Date(data);

        if (isNaN(date.getTime())) {
            return { valid: false, error: 'Data inválida' };
        }

        // Não permite datas no passado
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        if (date < hoje) {
            return { valid: false, error: 'Data não pode ser no passado' };
        }

        return { valid: true };
    },

    /**
     * Valida URL
     */
    url: (url) => {
        if (!url || typeof url !== 'string') {
            return { valid: false, error: 'URL é obrigatória' };
        }

        try {
            new URL(url);
            return { valid: true };
        } catch {
            return { valid: false, error: 'URL inválida' };
        }
    },

    /**
     * Sanitiza string (remove HTML/scripts)
     */
    sanitize: (str) => {
        if (typeof str !== 'string') {
            return str;
        }

        // Remove tags HTML e scripts
        return str
            .replace(/<[^>]*>/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
    },

    /**
     * Valida objeto completo
     */
    validateObject: (obj, schema) => {
        const errors = {};

        for (const [field, rules] of Object.entries(schema)) {
            const value = obj[field];

            if (rules.required && !value) {
                errors[field] = `${field} é obrigatório`;
                continue;
            }

            if (value && rules.type) {
                const validator = validation[rules.type];
                if (validator) {
                    const result = validator(value, rules.min, rules.max);
                    if (!result.valid) {
                        errors[field] = result.error;
                    }
                }
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors: Object.keys(errors).length > 0 ? errors : undefined
        };
    }
};

module.exports = validation;
console.log('✅ Validation module carregado');
