// ==========================================
// CONFIGURAÇÃO DOS PACOTES
// ==========================================
const pacotesConfig = {
    'design-starter': {
        nome: 'DESIGN - STARTER',
        categoria: 'Design',
        descricao: 'Ideal para quem está começando e precisa de peças pontuais de design'
    },
    'design-pro': {
        nome: 'DESIGN - PRO',
        categoria: 'Design',
        descricao: 'Para quem quer presença digital consistente com identidade visual forte'
    },
    'design-branding': {
        nome: 'DESIGN - BRANDING',
        categoria: 'Design',
        descricao: 'Criação completa de identidade visual do zero para sua marca'
    },
    'foto-essencial': {
        nome: 'FOTOGRAFIA - ESSENCIAL',
        categoria: 'Fotografia',
        descricao: 'Sessão fotográfica para produto ou marca pessoal com entrega ágil'
    },
    'foto-marca-pessoal': {
        nome: 'FOTOGRAFIA - MARCA PESSOAL',
        categoria: 'Fotografia',
        descricao: 'Ensaio completo para posicionar sua imagem profissional nas redes'
    },
    'foto-produto': {
        nome: 'FOTOGRAFIA - PRODUTO',
        categoria: 'Fotografia',
        descricao: 'Fotos profissionais de produto para e-commerce e campanhas'
    },
    'video-reels': {
        nome: 'VÍDEO - REELS',
        categoria: 'Vídeo',
        descricao: 'Produção de reels e vídeos curtos otimizados para Instagram e TikTok'
    },
    'video-conteudo': {
        nome: 'VÍDEO - CONTEÚDO',
        categoria: 'Vídeo',
        descricao: 'Pacote mensal de vídeos para redes sociais com estratégia de conteúdo'
    },
    'video-institucional': {
        nome: 'VÍDEO - INSTITUCIONAL',
        categoria: 'Vídeo',
        descricao: 'Vídeo institucional completo para apresentar sua empresa com profissionalismo'
    },
    'empresa-business': {
        nome: 'EMPRESAS - BUSINESS',
        categoria: 'Empresas',
        descricao: 'Solução completa para empresas que precisam de presença visual consistente'
    },
    'empresa-premium': {
        nome: 'EMPRESAS - PREMIUM',
        categoria: 'Empresas',
        descricao: 'Para empresas que querem dominar o digital com conteúdo profissional em todas as frentes'
    },
    'empresa-personalizado': {
        nome: 'EMPRESAS - PERSONALIZADO',
        categoria: 'Empresas',
        descricao: 'Montamos juntos o pacote ideal para as necessidades específicas da sua empresa'
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
    
    const mensagem = `Olá! Gostaria de saber mais sobre o pacote *${pacote.nome}*. Poderia me enviar mais informações?`;
    
    return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

// ==========================================
// CONFIGURAR BOTÕES DE PACOTE
// ==========================================
function configurarBotoesPacotes() {
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

document.addEventListener('mousemove', e => {
    const offset = cursorAtivo ? 10 : 6;
    cursor.style.transform = `translate(${e.clientX - offset}px, ${e.clientY - offset}px)`;
});

// Hover nos elementos interativos
const elementosInterativos = document.querySelectorAll('a, button, .servicoCartao, .pacoteCartao, .depoimentoCartao, .portfolioItem, .funcaoTag, .btnPrimario, .btnFantasma, .pacoteBotao, .whatsappBotao');

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

// ==========================================
// TABS PACOTES
// ==========================================
function mostrarAba(idAba, evento) {
    document.querySelectorAll('.pacotesGrade').forEach(g => g.classList.remove('ativo'));
    document.querySelectorAll('.abaBotao').forEach(b => b.classList.remove('ativo'));

    const abaAlvo = document.getElementById(idAba);
    abaAlvo.classList.add('ativo');
    evento.currentTarget.classList.add('ativo');

    document.querySelectorAll('#' + idAba + ' .revelar').forEach((el, i) => {
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

// ==========================================
// FOOTER FIXO → NATURAL NO FINAL
// ==========================================
const rodapeElemento = document.getElementById('rodape');
function atualizarRodape() {
    const noFundo = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    rodapeElemento.style.position = noFundo ? 'relative' : 'fixed';
    document.body.style.paddingBottom = noFundo ? '0' : 'var(--alturaRodape)';
}

window.addEventListener('scroll', atualizarRodape);
window.addEventListener('resize', atualizarRodape);
atualizarRodape();

// ==========================================
// INICIALIZAÇÃO
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configurarBotoesPacotes);
} else {
    configurarBotoesPacotes();
}