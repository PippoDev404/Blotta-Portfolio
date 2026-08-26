// ==========================================
// CONFIGURAÇÃO DOS PACOTES
// ==========================================
const pacotesConfig = {
    // DESIGN (Antigos Avulsos)
    'design-landing': {
        nome: 'DESIGN - LANDING PAGE',
        categoria: 'Design',
        descricao: 'Página única de alta conversão para campanhas, lançamentos ou apresentação de serviço.'
    },
    'design-identidade': {
        nome: 'DESIGN - IDENTIDADE VISUAL',
        categoria: 'Design',
        descricao: 'Criação de identidade visual completa para posicionar sua marca com consistência.'
    },
    'design-posts': {
        nome: 'DESIGN - POSTS PARA REDES',
        categoria: 'Design',
        descricao: 'Pacote avulso com 6 posts para redes sociais, prontos para publicar.'
    },

    // FOTOGRAFIA
    'foto-esportiva': {
        nome: 'FOTOGRAFIA - ESPORTIVA',
        categoria: 'Fotografia',
        descricao: 'Cobertura fotográfica de partidas e jogos esportivos.'
    },
    'foto-casamento': {
        nome: 'FOTOGRAFIA - CASAMENTO',
        categoria: 'Fotografia',
        descricao: 'Cobertura fotográfica de casamentos, com valor final de acordo com os detalhes do evento.'
    },
    'foto-ensaios': {
        nome: 'FOTOGRAFIA - ENSAIOS EM GERAL',
        categoria: 'Fotografia',
        descricao: 'Ensaios fotográficos personalizados — família, marca pessoal, produto e outros.'
    },

    // EMPRESAS
    'empresa-essencial': {
        nome: 'EMPRESAS - ESSENCIAL',
        categoria: 'Empresas',
        descricao: 'Gestão de conteúdo mensal para empresas que querem começar com consistência.'
    },
    'empresa-profissional': {
        nome: 'EMPRESAS - PROFISSIONAL',
        categoria: 'Empresas',
        descricao: 'Mais volume de conteúdo e estratégia para empresas em crescimento.'
    },
    'empresa-completo': {
        nome: 'EMPRESAS - COMPLETO',
        categoria: 'Empresas',
        descricao: 'Gestão completa de conteúdo para empresas que querem dominar as redes.'
    }
};

// ==========================================
// FUNÇÃO PARA CRIAR LINK DO WHATSAPP
// ==========================================
function criarLinkWhatsApp(pacoteId) {
    const pacote = pacotesConfig[pacoteId];
    const telefone = '5513997411505';
    
    if (!pacote) {
        return `https://wa.me/${telefone}`;
    }
    
    const mensagem = `Olá! Gostaria de saber mais sobre o pacote *${pacote.nome}*. ${pacote.descricao} Poderia me enviar mais informações?`;
    
    return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

// ==========================================
// CONFIGURAR BOTÕES DE PACOTE
// ==========================================
function configurarBotoesPacotes() {
    // Seleciona os botões com a nova classe .pacoteBotao e o atributo data-pacote
    const botoesPacotes = document.querySelectorAll('.pacoteBotao[data-pacote]');

    botoesPacotes.forEach(botao => {
        const pacoteId = botao.getAttribute('data-pacote');
        const linkWhatsApp = criarLinkWhatsApp(pacoteId);

        botao.href = linkWhatsApp;
        botao.target = '_blank';
        botao.rel = 'noopener noreferrer';
    });
}

// ==========================================
// CURSOR - Atualização DIRETA no mousemove
// ==========================================
const cursor = document.getElementById('cursor');
let cursorAtivo = false;

if (cursor) {
    document.addEventListener('mousemove', e => {
        const offset = cursorAtivo ? 10 : 6;
        cursor.style.transform = `translate(${e.clientX - offset}px, ${e.clientY - offset}px)`;
    });

    // Hover nos elementos interativos (inclui as novas classes .pacoteCartao e .pacoteBotao)
    const elementosInterativos = document.querySelectorAll('a, button, .servicoCartao, .pacoteCartao, .depoimentoCartao, .portfolioItem, .funcaoTag, .btnPrimario, .btnFantasma, .pacoteBotao, .whatsappBotao, .abaBotao');

    elementosInterativos.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorAtivo = true;
            cursor.classList.add('ativo');
        });
        el.addEventListener('mouseleave', () => {
            cursorAtivo = false;
            cursor.classList.remove('ativo');
        });
    });
}

// ==========================================
// TABS PACOTES
// ==========================================
function mostrarAba(idAba, evento) {
    // Remove a classe ativo de todas as grades e botões
    document.querySelectorAll('.pacotesGrade').forEach(g => g.classList.remove('ativo'));
    document.querySelectorAll('.abaBotao').forEach(b => b.classList.remove('ativo'));

    // Adiciona a classe ativo na aba alvo e no botão clicado
    const abaAlvo = document.getElementById(idAba);
    if (abaAlvo) {
        abaAlvo.classList.add('ativo');
    }
    if (evento && evento.currentTarget) {
        evento.currentTarget.classList.add('ativo');
    }

    // Reinicia a animação dos elementos dentro da aba selecionada
    const elementosAba = document.querySelectorAll('#' + idAba + ' .revelar');
    elementosAba.forEach((el, i) => {
        el.classList.remove('visivel');
        setTimeout(() => el.classList.add('visivel'), i * 80 + 50);
    });
}

// ==========================================
// SCROLL REVEAL
// ==========================================
const elementosRevelar = document.querySelectorAll('.revelar');
const observador = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visivel'), i * 80);
            observador.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
});

elementosRevelar.forEach(el => observador.observe(el));

// ==========================================
// NAV SCROLL
// ==========================================
const navegacao = document.querySelector('nav');
if (navegacao) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            navegacao.style.background = 'rgba(10, 10, 10, 0.97)';
            navegacao.style.borderBottom = '1px solid #1a1a1a';
            navegacao.style.padding = '16px 60px';
        } else {
            navegacao.style.background = 'linear-gradient(to bottom, rgba(10, 10, 10, 0.95) 0%, transparent 100%)';
            navegacao.style.borderBottom = '1px solid transparent';
            navegacao.style.padding = '24px 60px';
        }
    });
}

// ==========================================
// FOOTER FIXO → NATURAL NO FINAL
// ==========================================
const rodapeElemento = document.getElementById('rodape');
if (rodapeElemento) {
    function atualizarRodape() {
        const noFundo = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        rodapeElemento.style.position = noFundo ? 'relative' : 'fixed';
        document.body.style.paddingBottom = noFundo ? '0' : 'var(--alturaRodape, 0px)';
    }

    window.addEventListener('scroll', atualizarRodape);
    window.addEventListener('resize', atualizarRodape);
    atualizarRodape();
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configurarBotoesPacotes);
} else {
    configurarBotoesPacotes();
}