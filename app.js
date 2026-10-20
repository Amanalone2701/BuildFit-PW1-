const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' })); // Limite aumentado para salvar imagens em base64

const dbPath = path.join(__dirname, 'data.json');

// Função para ler o banco de dados
function loadDB() {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

// Função para salvar no banco de dados
function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

app.get('/', (req, res) => res.render('login'));

app.get('/cadastro', (req, res) => res.render('cadastro'));

app.post('/cadastro', (req, res) => {
    const { nome, email, senha, confirmaSenha } = req.body;
    if (senha !== confirmaSenha) {
        return res.send("<script>alert('As senhas não coincidem!'); window.location.href='/cadastro';</script>");
    }
    
    const db = loadDB();
    db[req.ip] = {
        user: { nome, email, senha },
        perfil: { foto: 'https://via.placeholder.com/60/f0ad4e/000000?text=Insira+Foto' },
        estadoConstrutor: { htmlTreinos: '', htmlExercicios: '', htmlCronograma: '', htmlTreinoPreenchido: '' }
    };
    saveDB(db);
    res.redirect('/');
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    const db = loadDB();
    const conta = db[req.ip];

    if (conta && conta.user.email === email && conta.user.senha === senha) {
        res.redirect('/inicial');
    } else {
        res.send("<script>alert('Login inválido ou IP sem cadastro!'); window.location.href='/';</script>");
    }
});

app.get('/inicial', (req, res) => {
    const db = loadDB();
    if (!db[req.ip]) return res.redirect('/');
    res.render('inicial', { conta: db[req.ip] });
});

app.get('/conta', (req, res) => {
    const db = loadDB();
    if (!db[req.ip]) return res.redirect('/');
    res.render('conta', { conta: db[req.ip] });
});

// Rota API para salvar estado do construtor dinamicamente
app.post('/api/salvar-estado', (req, res) => {
    const db = loadDB();
    if (db[req.ip]) {
        db[req.ip].estadoConstrutor = req.body;
        saveDB(db);
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Não autorizado' });
    }
});

// Rota API para atualizar perfil
app.post('/api/atualizar-perfil', (req, res) => {
    const db = loadDB();
    if (db[req.ip]) {
        if(req.body.nome) db[req.ip].user.nome = req.body.nome;
        if(req.body.email) db[req.ip].user.email = req.body.email;
        if(req.body.foto) db[req.ip].perfil.foto = req.body.foto;
        if(req.body.senhaAtual) {
            if(db[req.ip].user.senha === req.body.senhaAtual && req.body.novaSenha === req.body.confirmaNovaSenha) {
                db[req.ip].user.senha = req.body.novaSenha;
            } else {
                return res.json({ success: false, msg: 'Senha atual incorreta ou nova senha não confere.' });
            }
        }
        saveDB(db);
        res.json({ success: true });
    }
});

app.listen(3000, () => console.log('BuildFit rodando em http://localhost:3000'));