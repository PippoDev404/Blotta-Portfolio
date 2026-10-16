// ==========================================
// SUPABASE - CONFIGURAÇÃO E INICIALIZAÇÃO
// ==========================================
async function initSupabase() {
    if (!window.supabase) {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    const SUPABASE_URL = 'https://jgwecehhfsxdiaxeiizk.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2VjZWhoZnN4ZGlheGVpaXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNzI4OTMsImV4cCI6MjEwNzY0ODg5M30.sM-krIWilWTqlRYa01dpvmKXAHg2WGZJKTqgYEjjEXs';

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    await Promise.all([
        carregarERenderizarSobre(supabase),
        carregarERenderizarServicos(supabase),
        carregarERenderizarProjetos(supabase),
        carregarERenderizarPacotes(supabase),
        carregarERenderizarDepoimentos(supabase),
        carregarERenderizarContato(supabase)
    ]);

    supabase.channel('site-sobre')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sobre' }, () => carregarERenderizarSobre(supabase))
        .subscribe();

    supabase.channel('site-servicos')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'servicos' }, () => carregarERenderizarServicos(supabase))
        .subscribe();

    supabase.channel('site-projetos')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projetos' }, () => carregarERenderizarProjetos(supabase))
        .subscribe();

    supabase.channel('site-pacotes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pacotes' }, () => carregarERenderizarPacotes(supabase))
        .subscribe();

    supabase.channel('site-depoimentos')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'depoimentos' }, () => carregarERenderizarDepoimentos(supabase))
        .subscribe();

    supabase.channel('site-contato')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contato' }, () => carregarERenderizarContato(supabase))
        .subscribe();
}

// ==========================================
// SOBRE
// ==========================================
async function carregarERenderizarSobre(supabase) {
    const { data, error } = await supabase.from('sobre').select('*').limit(1).single();
    if (error) return;
    renderizarSobre(data);
}

function renderizarSobre(sobre) {
    const textoContainer = document.getElementById('sobreTextoContainer');
    const cartaoContainer = document.getElementById('sobreCartaoContainer');
    if (!textoContainer || !cartaoContainer) return;

    textoContainer.innerHTML = `
        <div class="secaoTag">Sobre mim</div>
        <h2>DANIEL<br>BLOTTA</h2>
        <div class="sobreFuncoes">
            <span class="funcaoTag"><i class="fa-solid fa-pen-nib"></i> Designer</span>
            <span class="funcaoTag"><i class="fa-solid fa-camera"></i> Fotógrafo</span>
            <span class="funcaoTag"><i class="fa-solid fa-clapperboard"></i> Video Maker</span>
        </div>
        <p>${sobre.texto_principal}</p>
        <p>${sobre.texto_secundario}</p>
        <p>Me acompanhe no Instagram <strong>${sobre.instagram}</strong> para ver meu processo e projetos em andamento.</p>
        <a href="https://instagram.com/${sobre.instagram.replace('@', '')}" target="_blank" class="btnPrimario" style="display:inline-flex; margin-top:16px;">
            <i class="fa-brands fa-instagram"></i> ${sobre.instagram}
        </a>
    `;

    cartaoContainer.innerHTML = `
        <div class="sobreCartao">
            <div class="sobreCartaoTitulo">Meus<br><span>Diferenciais</span></div>
            <ul class="listaHabilidades">
                <li>Design + Foto + Vídeo <span>★★★★★</span></li>
                <li>Atendimento Direto <span>★★★★★</span></li>
                <li>Alta Conversão <span>★★★★★</span></li>
                <li>Entrega no Prazo <span>★★★★★</span></li>
                <li>Revisões Inclusas <span>★★★★★</span></li>
            </ul>
        </div>
    `;
}

// ==========================================
// SERVIÇOS
// ==========================================
async function carregarERenderizarServicos(supabase) {
    const { data, error } = await supabase.from('servicos').select('*').order('ordem');
    if (error) return;
    renderizarServicos(data);
}

function renderizarServicos(servicos) {
    const grade = document.getElementById('servicosGrade');
    if (!grade) return;

    grade.innerHTML = servicos.map(s => `
        <div class="servicoCartao revelar visivel">
            <div class="servicoNum">${s.numero}</div>
            <div class="servicoIcone"><i class="${s.icone}"></i></div>
            <div class="servicoTitulo">${s.titulo}</div>
            <p class="servicoDesc">${s.descricao}</p>
            <ul class="servicoLista">
                ${(s.itens || []).map(i => `<li>${i}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

// ==========================================
// PROJETOS COM GALERIA E AUTOPLAY
// ==========================================
async function carregarERenderizarProjetos(supabase) {
    const { data, error } = await supabase.from('projetos').select('*').order('created_at', { ascending: false });
    if (error) return;
    renderizarPortfolio(data);
}

function renderizarPortfolio(projetos) {
    const track = document.getElementById('portfolioTrack');
    if (!track || !projetos || projetos.length === 0) return;

    const projetosDuplicados = [...projetos, ...projetos];

    track.innerHTML = projetosDuplicados.map(p => {
        const bgStyle = p.imagem
            ? `background-image: url('${p.imagem}'); background-size: cover; background-position: center;`
            : '';

        const fotosAdicionais = JSON.stringify(p.fotos_adicionais || []);

        return `
            <div class="portfolioSlide ${p.classe || 'p1'}" 
                 data-categoria="${p.categoria || ''}" 
                 data-titulo="${p.titulo || ''}" 
                 data-desc="${p.descricao || ''}" 
                 data-imagem="${p.imagem || ''}"
                 data-fotos='${fotosAdicionais}'>
                <div class="portfolioFundo" style="${bgStyle}"></div>
                <div class="portfolioSobreposicao"></div>
                <div class="portfolioItemInterno">
                    <div class="portfolioConteudo">
                        <div class="portfolioCategoria">${p.categoria || ''}</div>
                        <div class="portfolioTitulo">${p.titulo || ''}</div>
                        <div class="portfolioVerMais">Ver projeto <i class="fa-solid fa-arrow-right"></i></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    setTimeout(() => {
        calcularDistanciaScroll();
        attachModalEvents();
    }, 100);
}

// ==========================================
// PACOTES
// ==========================================
async function carregarERenderizarPacotes(supabase) {
    const { data, error } = await supabase.from('pacotes').select('*').order('categoria').order('nome');
    if (error) return;
    renderizarPacotesSite(data);
}

function renderizarPacotesSite(pacotes) {
    const categorias = { design: 'abaDesign', foto: 'abaFoto', empresa: 'abaEmpresa' };

    Object.keys(categorias).forEach(cat => {
        const container = document.getElementById(categorias[cat]);
        if (!container) return;

        const pacotesCat = pacotes.filter(p => p.categoria === cat);
        const destaque = pacotesCat.find(p => p.destaque);
        const semDestaque = pacotesCat.filter(p => !p.destaque);
        let pacotesOrdenados = [];

        if (destaque && semDestaque.length >= 2) {
            pacotesOrdenados = [semDestaque[0], destaque, semDestaque[1]];
        } else if (destaque && semDestaque.length === 1) {
            pacotesOrdenados = [semDestaque[0], destaque];
        } else {
            pacotesOrdenados = pacotesCat;
        }

        container.innerHTML = pacotesOrdenados.map(p => `
            <div class="pacoteCartao ${p.destaque ? 'destaque' : ''}" data-pacote="${p.id}">
                ${p.destaque ? '<span class="pacoteDestaqueLegenda">Mais popular</span>' : ''}
                <div class="pacoteIcone"><i class="${p.icone || 'fa-solid fa-box'}"></i></div>
                <div class="pacoteNome">${p.nome || ''}</div>
                <div class="pacotePreco">${p.preco || ''} <small>${p.periodo || ''}</small></div>
                <p class="pacoteDesc">${p.descricao || ''}</p>
                <ul class="pacoteItens">
                    ${(p.itens || []).map(i => `<li><i class="fa-solid fa-check"></i> ${i}</li>`).join('')}
                </ul>
                <a href="#" class="pacoteBotao" target="_blank"><i class="fa-brands fa-whatsapp"></i> Quero esse</a>
            </div>
        `).join('');
    });

    configurarBotoesPacotes();
}

function configurarBotoesPacotes() {
    const botoesPacotes = document.querySelectorAll('.pacoteBotao');
    botoesPacotes.forEach(botao => {
        const cartao = botao.closest('.pacoteCartao');
        if (!cartao) return;
        const nomePacote = cartao.querySelector('.pacoteNome')?.textContent || 'um pacote';
        const telefone = '5513997411505';
        const mensagem = `Olá! Gostaria de saber mais sobre o pacote *${nomePacote}* que vi no site. Poderia me enviar mais informações?`;
        botao.href = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
        botao.target = '_blank';
        botao.rel = 'noopener noreferrer';
    });
}

// ==========================================
// DEPOIMENTOS
// ==========================================
async function carregarERenderizarDepoimentos(supabase) {
    const { data, error } = await supabase.from('depoimentos').select('*').order('ordem');
    if (error) return;
    renderizarDepoimentos(data);
}

function renderizarDepoimentos(depoimentos) {
    const grade = document.getElementById('depoimentosGrade');
    if (!grade) return;

    grade.innerHTML = depoimentos.map(d => `
        <div class="depoimentoCartao revelar visivel">
            <div class="depoimentoEstrelas">${'★'.repeat(d.estrelas)}</div>
            <p class="depoimentoTexto">"${d.texto}"</p>
            <div class="depoimentoAutor">
                <div class="depoimentoAvatar">${d.iniciais}</div>
                <div>
                    <div class="depoimentoNome">${d.nome}</div>
                    <div class="depoimentoFuncao">${d.funcao}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// CONTATO
// ==========================================
async function carregarERenderizarContato(supabase) {
    const { data, error } = await supabase.from('contato').select('*').limit(1).single();
    if (error) return;
    renderizarContato(data);
}

function renderizarContato(contato) {
    const textoContainer = document.getElementById('contatoTextoContainer');
    const acaoContainer = document.getElementById('contatoAcaoContainer');
    if (!textoContainer || !acaoContainer) return;

    textoContainer.innerHTML = `
        <div class="secaoTag">Contato</div>
        <h2>VAMOS CRIAR<br>ALGO INCRÍVEL?</h2>
        <p>Me manda uma mensagem no WhatsApp ou me segue no Instagram <strong style="color:var(--corBranco)">${contato.instagram}</strong>. Respondo rápido e sem enrolação!</p>
        <ul class="contatoInfo">
            <li><span class="icone"><i class="fa-solid fa-location-dot"></i></span> ${contato.localizacao}</li>
            <li><span class="icone"><i class="fa-brands fa-instagram"></i></span> Instagram: ${contato.instagram}</li>
            <li><span class="icone"><i class="fa-solid fa-bolt"></i></span> ${contato.tempo_resposta}</li>
        </ul>
    `;

    acaoContainer.innerHTML = `
        <a href="https://wa.me/${contato.whatsapp}" class="whatsappBotao" target="_blank">
            <i class="fa-brands fa-whatsapp wIcone"></i>
            FALAR AGORA
            <small>Via WhatsApp</small>
        </a>
    `;
}

// ==========================================
// CURSOR INSTANTÂNEO
// ==========================================
const cursor = document.getElementById('cursor');
let cursorAtivo = false;

if (cursor) {
    document.addEventListener('mousemove', e => {
        const offset = cursorAtivo ? 10 : 6;
        cursor.style.left = (e.clientX - offset) + 'px';
        cursor.style.top = (e.clientY - offset) + 'px';
    }, { passive: true });

    const elementosInterativos = document.querySelectorAll('a, button, .servicoCartao, .pacoteCartao, .depoimentoCartao, .portfolioSlide, .funcaoTag, .btnPrimario, .btnFantasma, .pacoteBotao, .whatsappBotao, .abaBotao');
    elementosInterativos.forEach(el => {
        el.addEventListener('mouseenter', () => { cursorAtivo = true; cursor.classList.add('ativo'); });
        el.addEventListener('mouseleave', () => { cursorAtivo = false; cursor.classList.remove('ativo'); });
    });
}

// ==========================================
// TABS PACOTES
// ==========================================
function mostrarAba(idAba, evento) {
    document.querySelectorAll('.pacotesGrade').forEach(g => g.classList.remove('ativo'));
    document.querySelectorAll('.abaBotao').forEach(b => b.classList.remove('ativo'));

    const abaAlvo = document.getElementById(idAba);
    if (abaAlvo) abaAlvo.classList.add('ativo');
    if (evento && evento.currentTarget) evento.currentTarget.classList.add('ativo');

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
}, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
elementosRevelar.forEach(el => observador.observe(el));

// ==========================================
// NAV SCROLL
// ==========================================
const navegacao = document.querySelector('nav');
if (navegacao) {
    let navTicking = false;
    window.addEventListener('scroll', () => {
        if (!navTicking) {
            requestAnimationFrame(() => {
                if (window.scrollY > 60) {
                    navegacao.style.background = 'rgba(10, 10, 10, 0.97)';
                    navegacao.style.borderBottom = '1px solid #1a1a1a';
                    navegacao.style.padding = '16px 60px';
                } else {
                    navegacao.style.background = 'linear-gradient(to bottom, rgba(10, 10, 10, 0.95) 0%, transparent 100%)';
                    navegacao.style.borderBottom = '1px solid transparent';
                    navegacao.style.padding = '24px 60px';
                }
                navTicking = false;
            });
            navTicking = true;
        }
    }, { passive: true });
}

// ==========================================
// FOOTER FIXO
// ==========================================
const rodapeElemento = document.getElementById('rodape');
if (rodapeElemento) {
    let footerTicking = false;
    function atualizarRodape() {
        const noFundo = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        rodapeElemento.style.position = noFundo ? 'relative' : 'fixed';
        document.body.style.paddingBottom = noFundo ? '0' : 'var(--alturaRodape, 0px)';
    }
    window.addEventListener('scroll', () => {
        if (!footerTicking) {
            requestAnimationFrame(() => {
                atualizarRodape();
                footerTicking = false;
            });
            footerTicking = true;
        }
    }, { passive: true });
    window.addEventListener('resize', atualizarRodape);
    atualizarRodape();
}

// ==========================================
// CAROUSEL INFINITO
// ==========================================
function calcularDistanciaScroll() {
    const track = document.getElementById('portfolioTrack');
    const slides = document.querySelectorAll('.portfolioSlide');

    if (!track || slides.length === 0) return false;

    const slidesOriginais = slides.length / 2;
    const primeiroSlide = slides[0];
    const slideWidth = primeiroSlide.offsetWidth;

    if (slideWidth === 0) return false;

    const distancia = (slideWidth + 20) * slidesOriginais;
    track.style.setProperty('--scroll-distance', `-${distancia}px`);
    track.classList.add('pronto');

    return true;
}

if (!calcularDistanciaScroll()) {
    requestAnimationFrame(() => {
        if (!calcularDistanciaScroll()) {
            setTimeout(calcularDistanciaScroll, 50);
        }
    });
}

window.addEventListener('resize', calcularDistanciaScroll);

// ==========================================
// MODAL DO PORTFOLIO COM GALERIA E AUTOPLAY
// ==========================================
const portfolioModal = document.getElementById('portfolioModal');
const portfolioModalOverlay = document.getElementById('portfolioModalOverlay');
const portfolioModalClose = document.getElementById('portfolioModalClose');
const modalCategoria = document.getElementById('modalCategoria');
const modalTitulo = document.getElementById('modalTitulo');
const modalDescricao = document.getElementById('modalDescricao');
const modalBtn = document.getElementById('modalBtn');

let currentImageIndex = 0;
let projectImages = [];
let autoplayInterval = null;
const AUTOPLAY_DELAY = 5000;

function attachModalEvents() {
    const slides = document.querySelectorAll('.portfolioSlide');
    slides.forEach(slide => {
        const newSlide = slide.cloneNode(true);
        slide.parentNode.replaceChild(newSlide, slide);

        newSlide.addEventListener('click', () => {
            const capa = newSlide.getAttribute('data-imagem');
            const adicionais = JSON.parse(newSlide.getAttribute('data-fotos') || '[]');

            if (capa && capa.trim() !== '') {
                projectImages = [capa, ...adicionais];
            } else {
                projectImages = [...adicionais];
            }

            currentImageIndex = 0;

            modalCategoria.textContent = newSlide.getAttribute('data-categoria');
            modalTitulo.textContent = newSlide.getAttribute('data-titulo');
            modalDescricao.textContent = newSlide.getAttribute('data-desc');
            modalBtn.href = '#pacotes';

            renderizarGaleria();

            portfolioModal.classList.add('ativo');
            document.body.style.overflow = 'hidden';

            setTimeout(() => {
                portfolioModal.offsetHeight;
                const activeImage = document.querySelector('.galleryImage.active');
                if (activeImage) {
                    activeImage.style.opacity = '1';
                }
            }, 100);

            iniciarAutoplay();
        });
    });

    // ✅ CORREÇÃO: Fechar o modal ao clicar no botão "Quero um projeto assim"
    if (modalBtn) {
        modalBtn.addEventListener('click', () => {
            fecharModal();
        });
    }
}

function renderizarGaleria() {
    const container = document.getElementById('galleryContainer');
    const prevBtn = document.getElementById('galleryPrev');
    const nextBtn = document.getElementById('galleryNext');

    container.innerHTML = '';

    if (projectImages.length === 0) {
        const div = document.createElement('div');
        div.className = 'galleryImage active';
        div.innerHTML = `
            <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--corPreto);color:var(--corSuave);">
                <i class="fa-solid fa-image" style="font-size:4rem;opacity:0.3;margin-bottom:16px;"></i>
                <p style="font-size:1rem;">Sem imagens disponíveis</p>
            </div>
        `;
        container.appendChild(div);
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        atualizarContador();
        return;
    }

    projectImages.forEach((imgSrc, index) => {
        const div = document.createElement('div');
        div.className = `galleryImage ${index === 0 ? 'active' : ''}`;

        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = `Projeto ${index + 1}`;
        img.loading = 'lazy';

        img.onerror = function () {
            this.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.style.cssText = `
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #05101a 0%, #0d2040 50%, #05101a 100%);
                color: var(--corSuave);
                position: absolute;
                top: 0;
                left: 0;
            `;
            fallback.innerHTML = `
                <i class="fa-solid fa-image" style="font-size:4rem;opacity:0.3;margin-bottom:16px;color:var(--corAzul);"></i>
                <p style="font-size:0.9rem;">Imagem não disponível</p>
                <p style="font-size:0.75rem;opacity:0.6;margin-top:8px;">Foto ${index + 1}</p>
            `;
            div.appendChild(fallback);
        };

        div.appendChild(img);
        container.appendChild(div);
    });

    atualizarContador();

    if (projectImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
    }
}

function atualizarContador() {
    const counter = document.getElementById('galleryCounter');
    if (counter) {
        if (projectImages.length === 0) {
            counter.textContent = '0 / 0';
        } else {
            counter.textContent = `${currentImageIndex + 1} / ${projectImages.length}`;
        }
    }
}

function mostrarImagem(index) {
    const imagens = document.querySelectorAll('.galleryImage');

    imagens.forEach(img => img.classList.remove('active'));

    if (imagens[index]) {
        imagens[index].classList.add('active');
    }

    atualizarContador();
}

function proximaImagem() {
    if (projectImages.length <= 1) return;
    currentImageIndex = (currentImageIndex + 1) % projectImages.length;
    mostrarImagem(currentImageIndex);
}

function imagemAnterior() {
    if (projectImages.length <= 1) return;
    currentImageIndex = (currentImageIndex - 1 + projectImages.length) % projectImages.length;
    mostrarImagem(currentImageIndex);
}

function iniciarAutoplay() {
    pararAutoplay();

    if (projectImages.length > 1) {
        autoplayInterval = setInterval(() => {
            proximaImagem();
        }, AUTOPLAY_DELAY);
    }
}

function pararAutoplay() {
    if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
    }
}

function reiniciarAutoplay() {
    if (projectImages.length > 1) {
        pararAutoplay();
        iniciarAutoplay();
    }
}

function fecharModal() {
    portfolioModal.classList.remove('ativo');
    document.body.style.overflow = '';
    currentImageIndex = 0;
    projectImages = [];
    pararAutoplay();
}

const galleryPrev = document.getElementById('galleryPrev');
const galleryNext = document.getElementById('galleryNext');

if (galleryPrev) galleryPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    imagemAnterior();
    reiniciarAutoplay();
});

if (galleryNext) galleryNext.addEventListener('click', (e) => {
    e.stopPropagation();
    proximaImagem();
    reiniciarAutoplay();
});

if (portfolioModalClose) portfolioModalClose.addEventListener('click', fecharModal);
if (portfolioModalOverlay) portfolioModalOverlay.addEventListener('click', fecharModal);

const galleryContainer = document.getElementById('galleryContainer');
if (galleryContainer) {
    galleryContainer.addEventListener('mouseenter', pararAutoplay);
    galleryContainer.addEventListener('mouseleave', () => {
        if (projectImages.length > 1) iniciarAutoplay();
    });
}

document.addEventListener('keydown', (e) => {
    if (!portfolioModal.classList.contains('ativo')) return;

    if (e.key === 'Escape') {
        fecharModal();
    } else if (e.key === 'ArrowLeft' && projectImages.length > 1) {
        imagemAnterior();
        reiniciarAutoplay();
    } else if (e.key === 'ArrowRight' && projectImages.length > 1) {
        proximaImagem();
        reiniciarAutoplay();
    }
});

let touchStartX = 0;
let touchEndX = 0;

if (portfolioModal) {
    portfolioModal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        pararAutoplay();
    }, { passive: true });

    portfolioModal.addEventListener('touchend', (e) => {
        if (projectImages.length <= 1) return;

        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        iniciarAutoplay();
    }, { passive: true });
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            proximaImagem();
        } else {
            imagemAnterior();
        }
    }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSupabase();
    });
} else {
    initSupabase();
}