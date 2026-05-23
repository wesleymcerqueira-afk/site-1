const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
const db = new sqlite3.Database('./TESTE.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err.message);
    } else {
        console.log('Conectado com sucesso ao banco SQLite (TESTE.db)!');
        
        // 🌟 CRIAÇÃO DA TABELA (Garante que o banco não fique vazio)
        db.run(`CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_barras TEXT UNIQUE NOT NULL,
            nome TEXT NOT NULL,
            preco REAL NOT NULL,
            quantidade_atual INTEGER NOT NULL,
            estoque_minimo INTEGER DEFAULT 0,
            categoria_id INTEGER
        )`, (tableErr) => {
            if (tableErr) {
                console.error('Erro ao criar tabela de produtos:', tableErr.message);
            } else {
                console.log('Tabela "produtos" verificada/criada com sucesso!');
            }
        });
    }
});
// ==========================================
// ROTA 1: Listar TODOS os produtos ← NOVA
// ==========================================
app.get('/api/produtos', (req, res) => {
    const query = `SELECT * FROM produtos`;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ==========================================
// ROTA 2: Pesquisa Rápida de Produtos
// ==========================================
app.get('/api/produtos/busca', (req, res) => {
    const termoBusca = req.query.q;

    // 🛑 Validação para evitar erro com valor undefined ou vazio
    if (!termoBusca) {
        return res.status(400).json({ error: 'O parâmetro de busca "q" é obrigatório.' });
    }

    const query = `SELECT * FROM produtos WHERE codigo_barras = ? OR nome LIKE ?`;

    db.all(query, [termoBusca, `%${termoBusca}%`], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ==========================================
// ROTA 3: Alerta de Estoque Baixo
// ==========================================
app.get('/api/produtos/alerta', (req, res) => {
    const query = `SELECT codigo_barras, nome, quantidade_atual, estoque_minimo FROM produtos WHERE quantidade_atual <= estoque_minimo`;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ==========================================
// ROTA 4: Cadastro de Novo Produto ← DUPLICATA REMOVIDA
// ==========================================
app.post('/api/produtos', (req, res) => {
    const { codigo_barras, nome, preco, quantidade_atual, estoque_minimo, categoria_id } = req.body;

    if (!codigo_barras || !nome || preco === undefined || quantidade_atual === undefined) {
        return res.status(400).json({ error: 'Por favor, preencha todos os campos obrigatórios.' });
    }

    const query = `
        INSERT INTO produtos (codigo_barras, nome, preco, quantidade_atual, estoque_minimo, categoria_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [codigo_barras, nome, preco, quantidade_atual, estoque_minimo || 0, categoria_id || null], function(err) {
        if (err) {
            console.error('Erro ao inserir no banco:', err.message);
            return res.status(500).json({ error: 'Erro ao cadastrar produto. A sigla/código já existe?' });
        }
        res.status(201).json({ message: 'Produto cadastrado com sucesso!', id: this.lastID });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor do Organiza+ rodando em http://localhost:${PORT}`);
});
// Captura o encerramento do servidor para fechar o banco de dados com segurança
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar o banco de dados:', err.message);
        } else {
            console.log('Conexão com o banco de dados SQLite encerrada.');
        }
        process.exit(0);
    });
});