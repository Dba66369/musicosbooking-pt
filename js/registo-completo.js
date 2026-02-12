import { auth, db } from './firebase.js';
import { 
    createUserWithEmailAndPassword, 
    sendEmailVerification,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ============================================
// REGISTO DE MÚSICO
// ============================================
export async function registarMusico(dados) {
    try {
        // Validações
        if (!validarDadosMusico(dados)) {
            throw new Error('Por favor, preencha todos os campos obrigatórios');
        }

        if (dados.senha !== dados.confirmarSenha) {
            throw new Error('As senhas não coincidem');
        }

        if (dados.senha.length < 6) {
            throw new Error('A senha deve ter no mínimo 6 caracteres');
        }

        // Criar utilizador no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            dados.email, 
            dados.senha
        );

        const user = userCredential.user;

        // Enviar email de verificação
        await sendEmailVerification(user);

        // Criar documento na collection 'users'
        await setDoc(doc(db, 'users', user.uid), {
            email: dados.email,
            nome: dados.nomeCompleto,
            telefone: dados.telefone,
            tipo: 'musico',
            verificado_email: false,
            criado_em: serverTimestamp(),
            atualizado_em: serverTimestamp()
        });

        // Criar perfil do músico na collection 'musicos'
        await setDoc(doc(db, 'musicos', user.uid), {
            id_user: user.uid,
            genero: dados.genero || '',
            preco_hora: parseFloat(dados.precoHora) || 0,
            descricao: dados.descricao || '',
            foto_url: '',
            cidades: dados.cidades || [],
            avaliacoes: [],
            media_avaliacoes: 0,
            total_avaliacoes: 0,
            ativo: true,
            criado_em: serverTimestamp()
        });

        return {
            sucesso: true,
            mensagem: 'Registo efetuado! Verifique seu email para ativar a conta.',
            userId: user.uid
        };

    } catch (error) {
        console.error('Erro no registo:', error);
        return {
            sucesso: false,
            mensagem: tratarErroFirebase(error)
        };
    }
}

// ============================================
// REGISTO DE EMPRESA
// ============================================
export async function registarEmpresa(dados) {
    try {
        // Validações
        if (!validarDadosEmpresa(dados)) {
            throw new Error('Por favor, preencha todos os campos obrigatórios');
        }

        if (dados.senha !== dados.confirmarSenha) {
            throw new Error('As senhas não coincidem');
        }

        if (dados.senha.length < 6) {
            throw new Error('A senha deve ter no mínimo 6 caracteres');
        }

        // Verificar se NIF já existe
        const nifExiste = await verificarNIFDuplicado(dados.nif);
        if (nifExiste) {
            throw new Error('Este NIF já está registado');
        }

        // Criar utilizador no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            dados.email, 
            dados.senha
        );

        const user = userCredential.user;

        // Enviar email de verificação
        await sendEmailVerification(user);

        // Criar documento na collection 'users'
        await setDoc(doc(db, 'users', user.uid), {
            email: dados.email,
            nome: dados.nomeEmpresa,
            telefone: dados.telefone,
            tipo: 'empresa',
            verificado_email: false,
            criado_em: serverTimestamp(),
            atualizado_em: serverTimestamp()
        });

        // Criar perfil da empresa na collection 'empresas'
        await setDoc(doc(db, 'empresas', user.uid), {
            id_user: user.uid,
            nif: dados.nif,
            morada: dados.morada || '',
            pessoa_contacto: dados.pessoaContacto || '',
            ativo: true,
            criado_em: serverTimestamp()
        });

        return {
            sucesso: true,
            mensagem: 'Registo efetuado! Verifique seu email para ativar a conta.',
            userId: user.uid
        };

    } catch (error) {
        console.error('Erro no registo:', error);
        return {
            sucesso: false,
            mensagem: tratarErroFirebase(error)
        };
    }
}

// ============================================
// LOGIN
// ============================================
export async function fazerLogin(email, senha) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // Verificar se email foi confirmado
        if (!user.emailVerified) {
            await auth.signOut();
            throw new Error('Por favor, verifique seu email antes de fazer login. Verifique sua caixa de entrada e spam.');
        }

        // Buscar dados do utilizador
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            throw new Error('Utilizador não encontrado');
        }

        const userData = userDoc.data();

        return {
            sucesso: true,
            tipo: userData.tipo,
            userId: user.uid,
            nome: userData.nome
        };

    } catch (error) {
        console.error('Erro no login:', error);
        return {
            sucesso: false,
            mensagem: tratarErroFirebase(error)
        };
    }
}

// ============================================
// RESET DE SENHA
// ============================================
export async function resetarSenha(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return {
            sucesso: true,
            mensagem: 'Email de recuperação enviado! Verifique sua caixa de entrada.'
        };
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        return {
            sucesso: false,
            mensagem: tratarErroFirebase(error)
        };
    }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function validarDadosMusico(dados) {
    return dados.nomeCompleto && 
           dados.email && 
           dados.telefone && 
           dados.senha && 
           dados.confirmarSenha;
}

function validarDadosEmpresa(dados) {
    return dados.nomeEmpresa && 
           dados.email && 
           dados.telefone && 
           dados.nif && 
           dados.senha && 
           dados.confirmarSenha;
}

async function verificarNIFDuplicado(nif) {
    try {
        const empresasRef = collection(db, 'empresas');
        const q = query(empresasRef, where('nif', '==', nif));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Erro ao verificar NIF:', error);
        return false;
    }
}

function tratarErroFirebase(error) {
    const erros = {
        'auth/email-already-in-use': 'Este email já está registado',
        'auth/invalid-email': 'Email inválido',
        'auth/weak-password': 'Senha muito fraca',
        'auth/user-not-found': 'Utilizador não encontrado',
        'auth/wrong-password': 'Senha incorreta',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
        'auth/network-request-failed': 'Erro de conexão. Verifique sua internet'
    };

    return erros[error.code] || error.message || 'Erro desconhecido';
}

// ============================================
// VERIFICAR ESTADO DE AUTENTICAÇÃO
// ============================================
export function verificarAutenticacao(callback) {
    auth.onAuthStateChanged(async (user) => {
        if (user && user.emailVerified) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                callback({
                    autenticado: true,
                    user: user,
                    dados: userDoc.data()
                });
            }
        } else {
            callback({ autenticado: false });
        }
    });
}

// ============================================
// LOGOUT
// ============================================
export async function fazerLogout() {
    try {
        await auth.signOut();
        return { sucesso: true };
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        return { sucesso: false, mensagem: error.message };
    }
}
