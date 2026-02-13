/**
 * Firebase Configuration for MúsicosBooking.pt
 * 
 * IMPORTANTE: Substituir com credenciais reais do seu projeto Firebase
 * Nunca adicione credenciais reais diretamente no código git!
 * Use variáveis de ambiente ou um arquivo .env
 */

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "musicosbooking-xxxxx.firebaseapp.com",
  projectId: "musicosbooking-xxxxx",
  storageBucket: "musicosbooking-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Email de administrador para notificações
export const ADMIN_EMAIL = "admin@musicosbooking.pt";

// Configuração de Segurança
export const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 900000, // 15 minutos
  sessionTimeout: 3600000, // 1 hora
  passwordMinLength: 8,
  requireEmailVerification: true,
  rateLimitRequests: 100, // por minuto
  rateLimitWindow: 60000 // 1 minuto
};

// Configuração de Templates de Email
export const EMAIL_TEMPLATES = {
  welcome: {
    subject: "Bem-vindo ao MúsicosBooking.pt!",
    template: "welcome"
  },
  verification: {
    subject: "Verifique o seu email",
    template: "verification"
  },
  passwordReset: {
    subject: "Recuperação de password",
    template: "password_reset"
  },
  newUserAdmin: {
    subject: "Novo registo no MúsicosBooking.pt",
    template: "new_user_admin"
  },
  userDeletedAdmin: {
    subject: "Utilizador deletou a conta",
    template: "user_deleted_admin"
  },
  bookingConfirmed: {
    subject: "Booking confirmado!",
    template: "booking_confirmed"
  },
  bookingUpdated: {
    subject: "Booking atualizado",
    template: "booking_updated"
  },
  paymentConfirmed: {
    subject: "Pagamento confirmado",
    template: "payment_confirmed"
  }
};

// Tipos de utilizador
export const USER_TYPES = {
  MUSICIAN: "musician",
  COMPANY: "company",
  ADMIN: "admin"
};

// Status de booking
export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DISPUTE: "dispute"
};

// Métodos de pagamento
export const PAYMENT_METHODS = {
  BANK_TRANSFER: "bank_transfer",
  PAYPAL: "paypal",
  MBWAY: "mbway"
};

console.log('✅ Firebase config loaded successfully');


// Função para obter a configuração do Firebase
export const getFirebaseConfig = () => FIREBASE_CONFIG;
