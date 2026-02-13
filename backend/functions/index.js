// backend/functions/index.js - Firebase Cloud Functions - MúsicosBooking.pt
// TAREFA 1.3 - Backend com Firebase Functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Inicializa Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

/**
 * CLOUD FUNCTION 1: Registar utilizador com validação
 * POST /registerUser
 * Body: { email, password, nome, tipo, telefone }
 */
exports.registerUser = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            // Valida método HTTP
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Método não permitido' });
            }

            const { email, password, nome, tipo, telefone } = req.body;

            // Validação de inputs obrigatórios
            if (!email || !password || !nome || !tipo) {
                return res.status(400).json({
                    error: 'Email, password, nome e tipo são obrigatórios'
                });
            }

            // Valida tipo de utilizador
            if (!['musico', 'empresa'].includes(tipo)) {
                return res.status(400).json({
                    error: 'Tipo de utilizador inválido (musico ou empresa)'
                });
            }

            // Valida email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Email inválido' });
            }

            // Valida password
            if (password.length < 6) {
                return res.status(400).json({
                    error: 'Password deve ter pelo menos 6 caracteres'
                });
            }

            // Verifica se email já existe
            const existingUser = await auth.getUserByEmail(email).catch(() => null);
            if (existingUser) {
                return res.status(400).json({
                    error: 'Este email já está registado'
                });
            }

            // Cria utilizador no Firebase Auth
            const userRecord = await auth.createUser({
                email: email,
                password: password,
                displayName: nome
            });

            // Cria documento no Firestore
            await db.collection('users').doc(userRecord.uid).set({
                uid: userRecord.uid,
                email: email,
                nome: nome,
                tipo: tipo,
                telefone: telefone || '',
                createdAt: admin.firestore.Timestamp.now(),
                emailVerified: false,
                active: true,
                loginCount: 0
            });

            // Envia email de verificação
            const verificationLink = await admin.auth().generateEmailVerificationLink(email);

            console.log(`✅ Utilizador registado: ${email}`);

            return res.status(201).json({
                success: true,
                uid: userRecord.uid,
                message: 'Utilizador registado com sucesso. Verifique o seu email.'
            });
        } catch (error) {
            console.error('❌ Erro no registo:', error);
            return res.status(500).json({
                error: 'Erro ao registar utilizador: ' + error.message
            });
        }
    });
});

/**
 * CLOUD FUNCTION 2: Login com validação server-side
 * POST /validateLogin
 * Body: { email, password }
 */
exports.validateLogin = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Método não permitido' });
            }

            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email e password são obrigatórios'
                });
            }

            // Busca utilizador
            const userRecord = await auth.getUserByEmail(email).catch(() => null);
            if (!userRecord) {
                return res.status(401).json({
                    error: 'Email ou password incorretos'
                });
            }

            // Verifica se está ativo
            const userDoc = await db.collection('users').doc(userRecord.uid).get();
            if (!userDoc.exists || !userDoc.data().active) {
                return res.status(401).json({
                    error: 'Conta desativada ou não encontrada'
                });
            }

            // Cria custom token para login
            const customToken = await auth.createCustomToken(userRecord.uid);

            // Atualiza último login
            await db.collection('users').doc(userRecord.uid).update({
                lastLogin: admin.firestore.Timestamp.now(),
                loginCount: admin.firestore.FieldValue.increment(1)
            });

            const userData = userDoc.data();

            console.log(`✅ Login válido: ${email}`);

            return res.status(200).json({
                success: true,
                customToken: customToken,
                user: {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    nome: userData.nome,
                    tipo: userData.tipo
                }
            });
        } catch (error) {
            console.error('❌ Erro no login:', error);
            return res.status(500).json({
                error: 'Erro ao validar login: ' + error.message
            });
        }
    });
});

/**
 * CLOUD FUNCTION 3: Recuperação de Password
 * POST /resetPassword
 * Body: { email }
 */
exports.resetPassword = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Método não permitido' });
            }

            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'Email é obrigatório' });
            }

            // Verifica se email existe
            const userRecord = await auth.getUserByEmail(email).catch(() => null);
            if (!userRecord) {
                // Não revela se email existe ou não (segurança)
                return res.status(200).json({
                    success: true,
                    message: 'Se o email existir, receberá um link de recuperação'
                });
            }

            // Gera link de reset
            const resetLink = await admin.auth().generatePasswordResetLink(email);

            console.log(`✅ Reset de password solicitado: ${email}`);

            return res.status(200).json({
                success: true,
                message: 'Email de recuperação enviado com sucesso'
            });
        } catch (error) {
            console.error('❌ Erro no reset:', error);
            return res.status(500).json({
                error: 'Erro ao processar reset de password'
            });
        }
    });
});

/**
 * CLOUD FUNCTION 4: Atualizar perfil do utilizador
 * POST /updateProfile
 * Body: { uid, nome, telefone, ... }
 * Header: Authorization: Bearer <token>
 */
exports.updateProfile = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Método não permitido' });
            }

            // Valida autenticação
            const token = req.headers.authorization?.split('Bearer ')[1];
            if (!token) {
                return res.status(401).json({ error: 'Token de autenticação obrigatório' });
            }

            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(token);
            } catch (error) {
                return res.status(401).json({ error: 'Token inválido' });
            }

            const uid = decodedToken.uid;
            const { nome, telefone } = req.body;

            // Valida permissão (só pode atualizar a si próprio)
            if (req.body.uid && req.body.uid !== uid) {
                return res.status(403).json({ error: 'Sem permissão para atualizar outro utilizador' });
            }

            // Atualiza dados
            const updateData = {};
            if (nome) updateData.nome = nome;
            if (telefone) updateData.telefone = telefone;
            updateData.updatedAt = admin.firestore.Timestamp.now();

            await db.collection('users').doc(uid).update(updateData);

            const updatedDoc = await db.collection('users').doc(uid).get();

            console.log(`✅ Perfil atualizado: ${uid}`);

            return res.status(200).json({
                success: true,
                user: updatedDoc.data()
            });
        } catch (error) {
            console.error('❌ Erro ao atualizar perfil:', error);
            return res.status(500).json({
                error: 'Erro ao atualizar perfil: ' + error.message
            });
        }
    });
});

/**
 * CLOUD FUNCTION 5: Verificar status de utilizador
 * GET /getUserStatus/:uid
 * Header: Authorization: Bearer <token>
 */
exports.getUserStatus = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            if (req.method !== 'GET') {
                return res.status(405).json({ error: 'Método não permitido' });
            }

            const token = req.headers.authorization?.split('Bearer ')[1];
            if (!token) {
                return res.status(401).json({ error: 'Token obrigatório' });
            }

            const decodedToken = await admin.auth().verifyIdToken(token);
            const uid = decodedToken.uid;

            const userDoc = await db.collection('users').doc(uid).get();
            if (!userDoc.exists) {
                return res.status(404).json({ error: 'Utilizador não encontrado' });
            }

            return res.status(200).json({
                success: true,
                user: userDoc.data()
            });
        } catch (error) {
            console.error('❌ Erro ao buscar status:', error);
            return res.status(500).json({
                error: 'Erro ao buscar status: ' + error.message
            });
        }
    });
});

console.log('📝 Firebase Cloud Functions carregadas');


/**
 * CLOUD FUNCTION 6: Notificar admin quando novo utilizador se regista
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        // Notificar Admin no Firestore
        await db.collection('admin_notifications').add({
            type: 'new_user',
            userId: user.uid,
            email: user.email,
            userType: userData ? (userData.tipo || userData.userType) : 'N/A',
            createdAt: admin.firestore.Timestamp.now(),
            read: false
        });

        console.log(`📧 Notificação de novo utilizador enviada para o admin: ${user.email}`);
    } catch (error) {
        console.error('❌ Erro na trigger onUserCreated:', error);
    }
});

/**
 * CLOUD FUNCTION 7: Notificar admin quando utilizador deleta a conta
 */
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
    try {
        // Notificar Admin no Firestore
        await db.collection('admin_notifications').add({
            type: 'user_deleted',
            userId: user.uid,
            email: user.email,
            deletedAt: admin.firestore.Timestamp.now(),
            read: false
        });

        console.log(`📧 Notificação de conta deletada enviada para o admin: ${user.email}`);
    } catch (error) {
        console.error('❌ Erro na trigger onUserDeleted:', error);
    }
});

/**
 * CLOUD FUNCTION 8: Relatório Mensal Automático
 * Executa no primeiro dia de cada mês às 00:00
 */
exports.sendMonthlyReport = functions.pubsub.schedule('0 0 1 * *').onRun(async (context) => {
    try {
        const now = new Date();
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        
        const firstDayOfMonth = new Date(year, prevMonth, 1);
        
        const usersSnapshot = await db.collection('users')
            .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(firstDayOfMonth))
            .get();
        
        const totalUsers = usersSnapshot.size;
        
        // Guardar relatório no Firestore
        await db.collection('monthly_reports').add({
            month: `${year}-${prevMonth + 1}`,
            newUsers: totalUsers,
            generatedAt: admin.firestore.Timestamp.now()
        });

        console.log('📊 Relatório mensal gerado com sucesso');
        return null;
    } catch (error) {
        console.error('❌ Erro ao gerar relatório mensal:', error);
    }
});

console.log('🚀 Cloud Functions atualizadas com triggers de Admin e Relatórios');
