
// 1. Configuração da URL Base da API (Backend)
// Mude a linha da URL para ficar exatamente assim:
const API_URL = 'http://localhost:3000/api';

// 2. ROTA DE ALERTAS: Carrega os produtos com estoque baixo no painel lateral
async function carregarAlertas() {
    try {
        const response = await fetch(`${API_URL}/produtos/alerta`);
        const produtos = await response.json();

        const tbody = document.getElementById('tabelaAlertas'); 
        if (!tbody) return; 
        
        tbody.innerHTML = ''; 

        if (produtos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-data">Tudo certo! Nenhum produto abaixo do mínimo.</td></tr>';
            return;
        }

        produtos.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${p.codigo_barras}</strong></td>
                    <td>${p.nome}</td>
                    <td><span class="badge-danger">${p.quantidade_atual} un</span></td>
                    <td>${p.estoque_minimo} un</td>
                </tr>`;
        });

    } catch (error) {
        console.error("Erro ao buscar alertas:", error);
    }
}

// 3. ROTA DE BUSCA: Procura o produto digitando a sigla no campo
async function buscarProduto() {
    const termo = document.getElementById('inputBusca').value.trim();
    if (!termo) return;

    try {
        const response = await fetch(`${API_URL}/produtos/busca?q=${termo}`);
        const produtos = await response.json();
        const tbody = document.getElementById('tabelaBusca');
        tbody.innerHTML = '';

        if (produtos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-data" style="color: #e74c3c;">Nenhum produto encontrado.</td></tr>';
            return;
        }

        produtos.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${p.codigo_barras}</strong></td>
                    <td>${p.nome}</td>
                    <td>R$ ${p.preco.toFixed(2)}</td>
                    <td>${p.quantidade_atual} un</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
    }
}

// 4. ROTA DE CADASTRO: Envia os dados do formulário para salvar no banco de dados
async function cadastrarProduto(event) {
    event.preventDefault(); // Impede a página de recarregar

    const dados = {
        codigo_barras: document.getElementById('cadSigla').value.trim(),
        nome: document.getElementById('cadNome').value.trim(),
        preco: parseFloat(document.getElementById('cadPreco').value),
        quantidade_atual: parseInt(document.getElementById('cadQtd').value),
        estoque_minimo: parseInt(document.getElementById('cadMinimo').value)
    };

    try {
        const response = await fetch(`${API_URL}/produtos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();

        if (response.ok) {
            alert('Sucesso: Produto cadastrado perfeitamente!');
            document.getElementById('formCadastro').reset(); // Limpa o formulário automaticamente
            
            if (typeof carregarAlertas === 'function') {
                carregarAlertas();
            }
        } else {
            alert('Erro ao cadastrar: ' + resultado.error);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Não foi possível conectar ao servidor backend. Verifique se ele está ligado no terminal.');
    }
}

// 5. INICIALIZADORES: Disparam as funções automaticamente quando a página abre
document.addEventListener('DOMContentLoaded', carregarAlertas);