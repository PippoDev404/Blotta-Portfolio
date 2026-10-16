let db;

function esperarSupabase() {
    return new Promise((resolve) => {
        const check = setInterval(() => {
            if (window.supabaseClient) {
                db = window.supabaseClient;
                clearInterval(check);
                resolve();
            }
        }, 100);
    });
}

function mostrarToast(mensagem, tipo = 'sucesso') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    const icon = tipo === 'sucesso' ? 'fa-circle-check' : 'fa-circle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${mensagem}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

let hasUnsavedChanges = false;
let pendingTabAction = null;

function setupUnsavedChangesDetection() {
    const forms = ['formSobre', 'formContato'];
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    hasUnsavedChanges = true;
                    mostrarAvisoNaoSalvo();
                });
            });
        }
    });
}

function mostrarAvisoNaoSalvo() {
    let aviso = document.getElementById('avisoNaoSalvo');
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.id = 'avisoNaoSalvo';
        aviso.className = 'avisoNaoSalvo';
        aviso.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Alterações não salvas';
        const formAcoes = document.querySelector('#formSobre .formAcoes') || document.querySelector('#formContato .formAcoes');
        if (formAcoes) formAcoes.appendChild(aviso);
    }
    aviso.style.display = 'flex';
}

function esconderAvisoNaoSalvo() {
    const aviso = document.getElementById('avisoNaoSalvo');
    if (aviso) aviso.style.display = 'none';
    hasUnsavedChanges = false;
}

function mostrarModalSaida(acaoCallback) {
    let modal = document.getElementById('modalSaida');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalSaida';
        modal.className = 'modalSaida';
        modal.innerHTML = `
            <div class="modalSaidaOverlay"></div>
            <div class="modalSaidaContent">
                <h3><i class="fa-solid fa-triangle-exclamation"></i> Atenção</h3>
                <p>Você tem alterações não salvas. Deseja realmente sair sem salvar?</p>
                <div class="modalSaidaBotoes">
                    <button class="btnModalCancelar" onclick="window.fecharModalSaida()">Cancelar</button>
                    <button class="btnModalConfirmar" id="btnConfirmarSaida">Sim, sair sem salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('btnConfirmarSaida').addEventListener('click', () => {
            window.fecharModalSaida();
            if (pendingTabAction) { pendingTabAction(); pendingTabAction = null; }
        });
    }
    modal.style.display = 'block';
    pendingTabAction = acaoCallback;
}

window.fecharModalSaida = function () {
    const modal = document.getElementById('modalSaida');
    if (modal) modal.style.display = 'none';
}

window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
});

window.fazerLogin = async function () {
    const email = document.getElementById('emailInput').value.trim();
    const senha = document.getElementById('senhaInput').value;
    const btn = document.getElementById('btnLogin');
    const erro = document.getElementById('loginErro');

    if (!email || !senha) { erro.textContent = 'Preencha email e senha'; erro.style.display = 'block'; return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Entrando...';
    erro.style.display = 'none';

    try {
        const { data, error } = await db.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('userEmail').innerHTML = '<i class="fa-solid fa-user"></i> ' + data.user.email;
        carregarDadosEmTempoReal();
        carregarSobre();
    } catch (error) {
        let msg = 'Erro ao fazer login';
        if (error.message.includes('Invalid login credentials')) msg = 'Email ou senha incorretos';
        else if (error.message.includes('Email not confirmed')) msg = 'Email não confirmado';
        erro.textContent = msg;
        erro.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar';
    }
}

window.fazerLogout = async function () {
    if (hasUnsavedChanges) {
        mostrarModalSaida(async () => { await db.auth.signOut(); resetarInterfaceLogin(); });
        return;
    }
    await db.auth.signOut();
    resetarInterfaceLogin();
}

function resetarInterfaceLogin() {
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('btnLogin').disabled = false;
    document.getElementById('btnLogin').innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar';
    document.getElementById('emailInput').value = '';
    document.getElementById('senhaInput').value = '';
    esconderAvisoNaoSalvo();
}

async function verificarSessao() {
    await esperarSupabase();
    const { data: { session } } = await db.auth.getSession();
    if (session) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('userEmail').innerHTML = '<i class="fa-solid fa-user"></i> ' + session.user.email;
        carregarDadosEmTempoReal();
        carregarSobre();
    }
}

async function carregarSobre() {
    const { data, error } = await db.from('sobre').select('*').limit(1).single();
    if (error && error.code !== 'PGRST116') return;
    if (data) {
        document.getElementById('sobreTexto1').value = data.texto_principal || '';
        document.getElementById('sobreTexto2').value = data.texto_secundario || '';
        document.getElementById('sobreInstagram').value = data.instagram || '';
        document.getElementById('sobreId').value = data.id || '';
    }
    esconderAvisoNaoSalvo();
}

window.salvarSobre = async function (e) {
    e.preventDefault();
    const id = document.getElementById('sobreId').value;
    const sobreData = {
        texto_principal: document.getElementById('sobreTexto1').value,
        texto_secundario: document.getElementById('sobreTexto2').value,
        instagram: document.getElementById('sobreInstagram').value,
        updated_at: new Date().toISOString()
    };
    try {
        let error;
        if (id) { const response = await db.from('sobre').update(sobreData).eq('id', id); error = response.error; }
        else { const response = await db.from('sobre').insert([sobreData]).select(); error = response.error; if (response.data && response.data[0]) document.getElementById('sobreId').value = response.data[0].id; }
        if (error) throw error;
        mostrarToast('Seção "Sobre" salva com sucesso!', 'sucesso');
        esconderAvisoNaoSalvo();
    } catch (error) { mostrarToast('Erro ao salvar: ' + error.message, 'erro'); }
}

async function carregarContato() {
    const { data, error } = await db.from('contato').select('*').limit(1).single();
    if (error && error.code !== 'PGRST116') return;
    if (data) {
        document.getElementById('contatoWhatsapp').value = data.whatsapp || '';
        document.getElementById('contatoInstagram').value = data.instagram || '';
        document.getElementById('contatoLocalizacao').value = data.localizacao || '';
        document.getElementById('contatoTempo').value = data.tempo_resposta || '';
        document.getElementById('contatoId').value = data.id || '';
    }
    esconderAvisoNaoSalvo();
}

window.salvarContato = async function (e) {
    e.preventDefault();
    const id = document.getElementById('contatoId').value;
    const contatoData = {
        whatsapp: document.getElementById('contatoWhatsapp').value,
        instagram: document.getElementById('contatoInstagram').value,
        localizacao: document.getElementById('contatoLocalizacao').value,
        tempo_resposta: document.getElementById('contatoTempo').value,
        updated_at: new Date().toISOString()
    };
    try {
        let error;
        if (id) { const response = await db.from('contato').update(contatoData).eq('id', id); error = response.error; }
        else { const response = await db.from('contato').insert([contatoData]).select(); error = response.error; if (response.data && response.data[0]) document.getElementById('contatoId').value = response.data[0].id; }
        if (error) throw error;
        mostrarToast('Informações de contato salvas com sucesso!', 'sucesso');
        esconderAvisoNaoSalvo();
    } catch (error) { mostrarToast('Erro ao salvar: ' + error.message, 'erro'); }
}

window.mostrarAbaAdmin = function (aba, evento) {
    if (hasUnsavedChanges) {
        mostrarModalSaida(() => { executarMudancaAba(aba, evento); if (aba === 'sobre') carregarSobre(); if (aba === 'contato') carregarContato(); if (aba === 'servicos') carregarServicos(); if (aba === 'pacotes') carregarPacotes(); if (aba === 'depoimentos') carregarDepoimentos(); });
        return;
    }
    executarMudancaAba(aba, evento);
    if (aba === 'sobre') carregarSobre();
    if (aba === 'contato') carregarContato();
    if (aba === 'servicos') carregarServicos();
    if (aba === 'pacotes') carregarPacotes();
    if (aba === 'depoimentos') carregarDepoimentos();
}

function executarMudancaAba(aba, evento) {
    document.querySelectorAll('.adminAba').forEach(a => a.style.display = 'none');
    document.querySelectorAll('.adminTab').forEach(t => t.classList.remove('ativo'));
    document.getElementById('aba' + aba.charAt(0).toUpperCase() + aba.slice(1)).style.display = 'block';
    evento.currentTarget.classList.add('ativo');
}

function carregarDadosEmTempoReal() {
    carregarProjetos();
    carregarPacotes();
    carregarServicos();
    carregarDepoimentos();
    db.channel('projetos-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'projetos' }, carregarProjetos).subscribe();
    db.channel('pacotes-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'pacotes' }, carregarPacotes).subscribe();
    db.channel('servicos-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'servicos' }, carregarServicos).subscribe();
    db.channel('depoimentos-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'depoimentos' }, carregarDepoimentos).subscribe();
}

// ===== SERVIÇOS =====
let servicosItens = [];
let proximoNumeroServico = 1;
const LIMITE_SERVICOS = 3;

async function carregarServicos() {
    const { data, error } = await db.from('servicos').select('*').order('ordem', { ascending: true });
    if (error) return console.error('Erro ao carregar serviços:', error);
    renderizarServicos(data);
    if (data && data.length > 0) {
        const maxNumero = Math.max(...data.map(s => parseInt(s.numero) || 0));
        proximoNumeroServico = maxNumero + 1;
    }
    const numeroInput = document.getElementById('servicoNumero');
    if (numeroInput) numeroInput.value = String(proximoNumeroServico).padStart(2, '0');
}

function renderizarServicos(servicos) {
    const lista = document.getElementById('listaServicos');
    const countElement = document.getElementById('countServicos');
    if (countElement) countElement.textContent = servicos.length;
    if (!servicos || servicos.length === 0) {
        lista.innerHTML = '<p style="color: var(--corSuave); text-align: center; padding: 40px;"><i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>Nenhum serviço cadastrado.</p>';
        return;
    }
    lista.innerHTML = servicos.map((s, index) => `
        <div class="itemLista" data-id="${s.id}" data-ordem="${s.ordem}">
            <div class="itemInfo">
                <div class="itemCategoria">
                    <span class="ordemBadge"><i class="fa-solid fa-hashtag"></i> ${String(s.ordem).padStart(2, '0')}</span>
                </div>
                <h3><i class="${s.icone || 'fa-solid fa-box'}"></i> ${s.titulo || 'Sem título'}</h3>
                <p>${(s.descricao || '').substring(0, 100)}${(s.descricao || '').length > 100 ? '...' : ''}</p>
                ${s.itens && s.itens.length > 0 ? `<small><i class="fa-solid fa-cube"></i> ${s.itens.length} itens</small>` : ''}
            </div>
            <div class="itemAcoes">
                <button class="btnEditar" onclick="window.editarServico('${s.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btnDeletar" onclick="window.deletarServico('${s.id}')" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </div>
    `).join('');
}

window.adicionarItem = function () {
    const input = document.getElementById('novoItemInput');
    const texto = input.value.trim();
    if (!texto) return mostrarToast('Digite um item para adicionar', 'erro');
    servicosItens.push({ id: Date.now(), texto });
    renderizarItensServico();
    input.value = '';
    input.focus();
}

function renderizarItensServico() {
    const lista = document.getElementById('listaItensServico');
    if (servicosItens.length === 0) {
        lista.innerHTML = '<li style="color: var(--corSuave); text-align: center; padding: 20px;"><i class="fa-solid fa-inbox" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>Nenhum item adicionado</li>';
        return;
    }
    lista.innerHTML = servicosItens.map((item, index) => `
        <li class="itemDinamico" draggable="true" data-index="${index}">
            <span class="dragHandle"><i class="fa-solid fa-grip-vertical"></i></span>
            <span class="itemTexto"><i class="fa-solid fa-circle-check" style="color: var(--corVerde); margin-right: 8px;"></i>${item.texto}</span>
            <input type="text" class="editInput" value="${item.texto}">
            <div class="itemAcoes">
                <button type="button" class="btnEditarItem" onclick="window.editarItemServico(${index})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="btnExcluirItem" onclick="window.excluirItemServico(${index})" title="Excluir"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </li>
    `).join('');
    setupDragItensServico();
}

function setupDragItensServico() {
    const items = document.querySelectorAll('#listaItensServico .itemDinamico');
    let draggedItem = null;
    let draggedIndex = null;

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            draggedIndex = parseInt(item.dataset.index);
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (draggedItem && draggedItem !== item) {
                items.forEach(i => i.classList.remove('drag-over'));
                item.classList.add('drag-over');
            }
        });

        item.addEventListener('dragleave', () => { item.classList.remove('drag-over'); });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            if (draggedItem && draggedItem !== item) {
                const targetIndex = parseInt(item.dataset.index);
                if (draggedIndex !== targetIndex) {
                    const [movido] = servicosItens.splice(draggedIndex, 1);
                    servicosItens.splice(targetIndex, 0, movido);
                    renderizarItensServico();
                }
            }
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            items.forEach(i => i.classList.remove('drag-over'));
            draggedItem = null;
            draggedIndex = null;
        });
    });
}

window.editarItemServico = function (index) {
    const itemLi = document.querySelectorAll('#listaItensServico .itemDinamico')[index];
    const editInput = itemLi.querySelector('.editInput');
    itemLi.classList.add('editing');
    editInput.focus();
    editInput.select();
    const salvar = () => {
        if (editInput.value.trim()) { servicosItens[index].texto = editInput.value.trim(); renderizarItensServico(); }
        else { itemLi.classList.remove('editing'); }
    };
    editInput.onkeypress = (e) => { if (e.key === 'Enter') { e.preventDefault(); salvar(); } };
    editInput.onblur = salvar;
}

window.excluirItemServico = function (index) {
    if (confirm('Deseja excluir este item?')) { servicosItens.splice(index, 1); renderizarItensServico(); }
}

window.salvarServico = async function (e) {
    e.preventDefault();
    const { data: servicosExistentes } = await db.from('servicos').select('id');
    const totalServicos = servicosExistentes ? servicosExistentes.length : 0;
    const id = document.getElementById('servicoId').value;

    if (!id && totalServicos >= LIMITE_SERVICOS) {
        mostrarToast(`Limite de ${LIMITE_SERVICOS} serviços atingido! Exclua um serviço para adicionar outro.`, 'erro');
        return;
    }

    const novaOrdem = totalServicos + 1;
    const servico = {
        numero: String(proximoNumeroServico).padStart(2, '0'),
        titulo: document.getElementById('servicoTitulo').value,
        descricao: document.getElementById('servicoDescricao').value,
        icone: document.getElementById('servicoIcone').value,
        ordem: id ? undefined : novaOrdem,
        itens: servicosItens.map(item => item.texto),
        updated_at: new Date().toISOString()
    };

    try {
        let error;
        if (id) {
            delete servico.ordem;
            delete servico.numero;
            const response = await db.from('servicos').update(servico).eq('id', id);
            error = response.error;
            mostrarToast('Serviço atualizado com sucesso!', 'sucesso');
        } else {
            const response = await db.from('servicos').insert([servico]);
            error = response.error;
            mostrarToast('Serviço adicionado com sucesso!', 'sucesso');
        }
        if (error) throw error;
        window.limparFormServico();
        carregarServicos();
    } catch (error) { mostrarToast('Erro ao salvar: ' + error.message, 'erro'); }
}

window.editarServico = async function (id) {
    const { data, error } = await db.from('servicos').select('*').eq('id', id).single();
    if (error) return mostrarToast('Erro ao carregar serviço', 'erro');
    document.getElementById('servicoId').value = id;
    document.getElementById('servicoNumero').value = data.numero || '';
    document.getElementById('servicoTitulo').value = data.titulo || '';
    document.getElementById('servicoDescricao').value = data.descricao || '';
    const iconeValor = data.icone || 'fa-solid fa-pen-nib';
    document.getElementById('servicoIcone').value = iconeValor;
    atualizarDisplayIcone(iconeValor);
    servicosItens = (data.itens || []).map((texto, index) => ({ id: Date.now() + index, texto }));
    renderizarItensServico();
    document.getElementById('tituloFormServico').textContent = 'Editar Serviço';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.deletarServico = async function (id) {
    if (!confirm('Tem certeza que deseja deletar este serviço?')) return;
    try {
        const { error } = await db.from('servicos').delete().eq('id', id);
        if (error) throw error;
        mostrarToast('Serviço deletado!', 'sucesso');
        carregarServicos();
    } catch (error) { mostrarToast('Erro ao deletar: ' + error.message, 'erro'); }
}

window.limparFormServico = function () {
    document.getElementById('formServico').reset();
    document.getElementById('servicoId').value = '';
    document.getElementById('tituloFormServico').textContent = 'Adicionar Serviço';
    document.getElementById('servicoNumero').value = String(proximoNumeroServico).padStart(2, '0');
    const iconePadrao = 'fa-solid fa-pen-nib';
    document.getElementById('servicoIcone').value = iconePadrao;
    atualizarDisplayIcone(iconePadrao);
    servicosItens = [];
    renderizarItensServico();
}

function atualizarDisplayIcone(iconeValor) {
    const selectedIconDisplay = document.getElementById('selectedIconDisplay');
    const selectedIconName = document.getElementById('selectedIconName');
    const iconOptions = document.querySelectorAll('#iconList .customIconOption');
    if (selectedIconDisplay) selectedIconDisplay.className = iconeValor;
    iconOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.value === iconeValor) {
            option.classList.add('selected');
            if (selectedIconName) selectedIconName.textContent = option.dataset.name;
        }
    });
}

function setupIconDropdown() {
    const iconTrigger = document.getElementById('iconTrigger');
    const iconList = document.getElementById('iconList');
    const iconHiddenInput = document.getElementById('servicoIcone');
    const iconOptions = document.querySelectorAll('#iconList .customIconOption');
    if (!iconTrigger || !iconList) return;
    iconTrigger.addEventListener('click', (e) => { e.stopPropagation(); iconTrigger.classList.toggle('active'); iconList.classList.toggle('show'); });
    iconOptions.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            const name = option.dataset.name;
            if (iconHiddenInput) iconHiddenInput.value = value;
            atualizarDisplayIcone(value);
            iconTrigger.classList.remove('active');
            iconList.classList.remove('show');
        });
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('#iconDropdown')) { iconTrigger.classList.remove('active'); iconList.classList.remove('show'); } });
    const initialIcon = iconHiddenInput ? iconHiddenInput.value : 'fa-solid fa-pen-nib';
    atualizarDisplayIcone(initialIcon);
}

// ===== PROJETOS COM CAPA E IMAGENS ADICIONAIS =====
let projetoImagensLista = [];

async function carregarProjetos() {
    const { data, error } = await db.from('projetos').select('*').order('created_at', { ascending: false });
    if (error) return;
    renderizarProjetos(data);
}

function renderizarProjetos(projetos) {
    const lista = document.getElementById('listaProjetos');
    if (!lista) return;
    
    if (projetos.length === 0) {
        lista.innerHTML = '<p style="color: var(--corSuave); text-align: center; padding: 40px;"><i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>Nenhum projeto cadastrado.</p>';
        return;
    }
    
    lista.innerHTML = projetos.map(p => {
        const totalImagens = 1 + (p.fotos_adicionais ? p.fotos_adicionais.length : 0);
        return `
            <div class="itemLista">
                ${p.imagem ? `<img src="${p.imagem}" class="projetoThumb" alt="${p.titulo || 'Projeto'}">` : '<div class="projetoThumb" style="background:#f1f5f9;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-image" style="color:#cbd5e1;font-size:1.5rem;"></i></div>'}
                <div class="itemInfo">
                    <div class="itemCategoria"><i class="fa-solid fa-tag"></i> ${p.categoria || ''}</div>
                    <h3>${p.titulo || 'Sem título'}</h3>
                    <p>${(p.descricao || '').substring(0, 100)}${(p.descricao || '').length > 100 ? '...' : ''}</p>
                    <small style="display:inline-flex;align-items:center;gap:6px;margin-top:6px;font-size:0.85rem;color:#94a3b8;font-weight:600;">
                        <i class="fa-solid fa-images" style="color:var(--corAzul);"></i> ${totalImagens} ${totalImagens === 1 ? 'imagem' : 'imagens'}
                    </small>
                </div>
                <div class="itemAcoes">
                    <button class="btnEditar" onclick="window.editarProjeto('${p.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btnDeletar" onclick="window.deletarProjeto('${p.id}')" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function setupCapaDropZone() {
    const dropZone = document.getElementById('capaDropZone');
    const fileInput = document.getElementById('projetoCapaFile');
    if (!dropZone) return;

    dropZone.addEventListener('click', (e) => {
        if (e.target.closest('.btnRemoveImage')) return;
        fileInput.click();
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) processarCapaProjeto(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) processarCapaProjeto(e.target.files[0]);
    });
}

function processarCapaProjeto(file) {
    const capaHidden = document.getElementById('projetoCapa');
    const dropContent = document.getElementById('capaDropContent');
    const imagePreview = document.getElementById('capaPreview');
    const imagePreviewImg = document.getElementById('capaPreviewImg');

    if (!file.type.startsWith('image/')) { mostrarToast('Selecione um arquivo de imagem válido', 'erro'); return; }
    if (file.size > 5 * 1024 * 1024) { mostrarToast('Imagem muito grande! Máximo 5MB', 'erro'); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        capaHidden.value = base64;
        imagePreviewImg.src = base64;
        dropContent.style.display = 'none';
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

window.removerCapaProjeto = function () {
    document.getElementById('projetoCapa').value = '';
    document.getElementById('projetoCapaFile').value = '';
    document.getElementById('capaDropContent').style.display = 'flex';
    document.getElementById('capaPreview').style.display = 'none';
}

function setupImagensDropZone() {
    const dropZone = document.getElementById('imagensDropZone');
    const fileInput = document.getElementById('projetoImagensFile');
    if (!dropZone) return;

    dropZone.addEventListener('click', (e) => {
        if (e.target.closest('.btnRemoveImagem')) return;
        fileInput.click();
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) processarImagensAdicionais(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) processarImagensAdicionais(e.target.files);
    });
}

function processarImagensAdicionais(files) {
    const imagensHidden = document.getElementById('projetoImagens');
    const dropContent = document.getElementById('imagensDropContent');
    const imagensGrid = document.getElementById('imagensPreviewGrid');
    
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            mostrarToast(`Arquivo "${file.name}" não é uma imagem válida`, 'erro');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            mostrarToast(`Imagem "${file.name}" muito grande! Máximo 5MB`, 'erro');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            const id = Date.now() + Math.random();
            projetoImagensLista.push({ id, base64, nome: file.name });
            renderizarImagensPreview();
        };
        reader.readAsDataURL(file);
    });
    
    if (projetoImagensLista.length > 0) {
        dropContent.style.display = 'none';
        imagensGrid.style.display = 'grid';
    }
}

function renderizarImagensPreview() {
    const grid = document.getElementById('imagensPreviewGrid');
    const dropContent = document.getElementById('imagensDropContent');
    const imagensHidden = document.getElementById('projetoImagens');
    
    if (projetoImagensLista.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        dropContent.style.display = 'flex';
        imagensHidden.value = '';
        return;
    }
    
    grid.style.display = 'grid';
    dropContent.style.display = 'none';
    
    grid.innerHTML = projetoImagensLista.map((img, index) => `
        <div class="imagemPreviewItem">
            <img src="${img.base64}" alt="Imagem ${index + 1}">
            <span class="imagemOrdem">${index + 1}</span>
            <button type="button" class="btnRemoveImagem" onclick="window.removerImagemAdicional(${img.id})" title="Remover imagem">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `).join('');
    
    imagensHidden.value = JSON.stringify(projetoImagensLista.map(img => img.base64));
}

window.removerImagemAdicional = function(id) {
    const index = projetoImagensLista.findIndex(img => img.id === id);
    if (index > -1) {
        projetoImagensLista.splice(index, 1);
        renderizarImagensPreview();
    }
}

window.salvarProjeto = async function (e) {
    e.preventDefault();
    const id = document.getElementById('projetoId').value;
    const capa = document.getElementById('projetoCapa').value;
    
    if (!capa) {
        mostrarToast('Imagem de capa é obrigatória!', 'erro');
        return;
    }
    
    const projeto = {
        categoria: document.getElementById('projetoCategoria').value,
        titulo: document.getElementById('projetoTitulo').value,
        descricao: document.getElementById('projetoDescricao').value,
        imagem: capa,
        fotos_adicionais: projetoImagensLista.map(img => img.base64),
        updated_at: new Date().toISOString()
    };
    
    try {
        let error;
        if (id) {
            error = (await db.from('projetos').update(projeto).eq('id', id)).error;
            mostrarToast('Projeto atualizado!', 'sucesso');
        } else {
            error = (await db.from('projetos').insert([projeto])).error;
            mostrarToast('Projeto adicionado!', 'sucesso');
        }
        if (error) throw error;
        window.limparFormProjeto();
        carregarProjetos();
    } catch (error) {
        mostrarToast('Erro: ' + error.message, 'erro');
    }
}

window.editarProjeto = async function (id) {
    const { data } = await db.from('projetos').select('*').eq('id', id).single();
    if (!data) return;
    
    document.getElementById('projetoId').value = id;
    document.getElementById('projetoCategoria').value = data.categoria || '';
    document.getElementById('projetoTitulo').value = data.titulo || '';
    document.getElementById('projetoDescricao').value = data.descricao || '';
    document.getElementById('projetoCapa').value = data.imagem || '';
    
    const capaDropContent = document.getElementById('capaDropContent');
    const capaPreview = document.getElementById('capaPreview');
    const capaPreviewImg = document.getElementById('capaPreviewImg');
    
    if (data.imagem) {
        capaPreviewImg.src = data.imagem;
        capaDropContent.style.display = 'none';
        capaPreview.style.display = 'block';
    } else {
        capaDropContent.style.display = 'flex';
        capaPreview.style.display = 'none';
    }
    
    projetoImagensLista = (data.fotos_adicionais || []).map((base64, index) => ({
        id: Date.now() + index,
        base64: base64,
        nome: `imagem-${index + 1}.jpg`
    }));
    renderizarImagensPreview();
    
    document.getElementById('tituloFormProjeto').textContent = 'Editar Projeto';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.limparFormProjeto = function () {
    document.getElementById('formProjeto').reset();
    document.getElementById('projetoId').value = '';
    document.getElementById('tituloFormProjeto').textContent = 'Adicionar Projeto';
    
    document.getElementById('projetoCapa').value = '';
    document.getElementById('projetoCapaFile').value = '';
    document.getElementById('capaDropContent').style.display = 'flex';
    document.getElementById('capaPreview').style.display = 'none';
    
    projetoImagensLista = [];
    renderizarImagensPreview();
}

window.deletarProjeto = async function (id) {
    if (!confirm('Deletar este projeto?')) return;
    const { error } = await db.from('projetos').delete().eq('id', id);
    if (!error) { mostrarToast('Deletado!', 'sucesso'); carregarProjetos(); }
}

// ===== PACOTES =====
let pacoteItensLista = [];

async function carregarPacotes() {
    const { data, error } = await db.from('pacotes').select('*').order('categoria').order('nome');
    if (error) return;
    renderizarPacotes(data);
}

function renderizarPacotes(pacotes) {
    const container = document.getElementById('listaPacotes');
    if (!pacotes || pacotes.length === 0) {
        container.innerHTML = '<p style="color: var(--corSuave); text-align: center; padding: 40px;"><i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>Nenhum pacote cadastrado.</p>';
        return;
    }

    const categorias = {
        design: { nome: 'Design', icone: 'fa-solid fa-palette' },
        foto: { nome: 'Fotografia', icone: 'fa-solid fa-camera' },
        empresa: { nome: 'Empresas', icone: 'fa-solid fa-building' }
    };

    const grupos = {};
    Object.keys(categorias).forEach(cat => { grupos[cat] = []; });
    pacotes.forEach(p => {
        if (grupos[p.categoria]) grupos[p.categoria].push(p);
        else grupos[p.categoria] = [p];
    });

    let html = '';
    Object.keys(categorias).forEach(catKey => {
        const itens = grupos[catKey];
        if (itens.length === 0) return;

        html += `
            <div class="pacoteCategoriaGrupo">
                <div class="pacoteCategoriaTitulo">
                    <i class="${categorias[catKey].icone}"></i>
                    ${categorias[catKey].nome}
                    <span class="categoriaCount">${itens.length} ${itens.length === 1 ? 'pacote' : 'pacotes'}</span>
                </div>
                <div class="listaItens">
                    ${itens.map(p => `
                        <div class="itemLista ${p.destaque ? 'itemDestaque' : ''}">
                            <div class="itemInfo">
                                <div class="itemCategoria">
                                    <i class="fa-solid fa-tag"></i> ${categorias[catKey].nome}
                                    ${p.destaque ? '<span class="pacoteDestaqueBadge"><i class="fa-solid fa-star"></i> Destaque</span>' : ''}
                                </div>
                                <h3>${p.nome || 'Sem nome'} <small style="color: var(--corAzul); font-family: Barlow;">${p.preco || ''}${p.periodo || ''}</small></h3>
                                <p>${p.descricao || ''}</p>
                                ${p.itens && p.itens.length > 0 ? `<small style="display:inline-flex;align-items:center;gap:6px;margin-left:0;margin-top:6px;font-size:0.85rem;color:#94a3b8;font-weight:600;background:#f1f5f9;padding:4px 12px;border-radius:12px;"><i class="fa-solid fa-cube" style="font-size:0.75rem;color:var(--corAzul);"></i> ${p.itens.length} itens</small>` : ''}
                            </div>
                            <div class="itemAcoes">
                                <button class="btnEditar" onclick="window.editarPacote('${p.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                                <button class="btnDeletar" onclick="window.deletarPacote('${p.id}')" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

window.adicionarItemPacote = function () {
    const input = document.getElementById('novoItemPacoteInput');
    const texto = input.value.trim();
    if (!texto) return mostrarToast('Digite um item para adicionar', 'erro');
    pacoteItensLista.push({ id: Date.now(), texto });
    renderizarItensPacote();
    input.value = '';
    input.focus();
}

function renderizarItensPacote() {
    const lista = document.getElementById('listaItensPacote');
    if (pacoteItensLista.length === 0) {
        lista.innerHTML = '<li style="color: var(--corSuave); text-align: center; padding: 20px;"><i class="fa-solid fa-inbox" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>Nenhum item adicionado</li>';
        return;
    }
    lista.innerHTML = pacoteItensLista.map((item, index) => `
        <li class="itemDinamico" draggable="true" data-index="${index}">
            <span class="dragHandle"><i class="fa-solid fa-grip-vertical"></i></span>
            <span class="itemTexto"><i class="fa-solid fa-circle-check" style="color: var(--corVerde); margin-right: 8px;"></i>${item.texto}</span>
            <input type="text" class="editInput" value="${item.texto}">
            <div class="itemAcoes">
                <button type="button" class="btnEditarItem" onclick="window.editarItemPacote(${index})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="btnExcluirItem" onclick="window.excluirItemPacote(${index})" title="Excluir"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </li>
    `).join('');
    setupDragItensPacote();
}

function setupDragItensPacote() {
    const items = document.querySelectorAll('#listaItensPacote .itemDinamico');
    let draggedItem = null;
    let draggedIndex = null;

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            draggedIndex = parseInt(item.dataset.index);
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (draggedItem && draggedItem !== item) {
                items.forEach(i => i.classList.remove('drag-over'));
                item.classList.add('drag-over');
            }
        });

        item.addEventListener('dragleave', () => { item.classList.remove('drag-over'); });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            if (draggedItem && draggedItem !== item) {
                const targetIndex = parseInt(item.dataset.index);
                if (draggedIndex !== targetIndex) {
                    const [movido] = pacoteItensLista.splice(draggedIndex, 1);
                    pacoteItensLista.splice(targetIndex, 0, movido);
                    renderizarItensPacote();
                }
            }
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            items.forEach(i => i.classList.remove('drag-over'));
            draggedItem = null;
            draggedIndex = null;
        });
    });
}

window.editarItemPacote = function (index) {
    const itemLi = document.querySelectorAll('#listaItensPacote .itemDinamico')[index];
    const editInput = itemLi.querySelector('.editInput');
    itemLi.classList.add('editing');
    editInput.focus();
    editInput.select();
    const salvar = () => {
        if (editInput.value.trim()) { pacoteItensLista[index].texto = editInput.value.trim(); renderizarItensPacote(); }
        else { itemLi.classList.remove('editing'); }
    };
    editInput.onkeypress = (e) => { if (e.key === 'Enter') { e.preventDefault(); salvar(); } };
    editInput.onblur = salvar;
}

window.excluirItemPacote = function (index) {
    if (confirm('Deseja excluir este item?')) { pacoteItensLista.splice(index, 1); renderizarItensPacote(); }
}

function setupPacoteIconDropdown() {
    const iconTrigger = document.getElementById('pacoteIconTrigger');
    const iconList = document.getElementById('pacoteIconList');
    const iconHiddenInput = document.getElementById('pacoteIcone');
    const iconOptions = document.querySelectorAll('#pacoteIconList .customIconOption');
    if (!iconTrigger || !iconList) return;

    iconTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        iconTrigger.classList.toggle('active');
        iconList.classList.toggle('show');
    });

    iconOptions.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            const name = option.dataset.name;
            if (iconHiddenInput) iconHiddenInput.value = value;
            atualizarDisplayIconePacote(value);
            iconTrigger.classList.remove('active');
            iconList.classList.remove('show');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#pacoteIconDropdown')) {
            iconTrigger.classList.remove('active');
            iconList.classList.remove('show');
        }
    });

    const initialIcon = iconHiddenInput ? iconHiddenInput.value : 'fa-solid fa-box';
    atualizarDisplayIconePacote(initialIcon);
}

function atualizarDisplayIconePacote(iconeValor) {
    const selectedIconDisplay = document.getElementById('pacoteSelectedIconDisplay');
    const selectedIconName = document.getElementById('pacoteSelectedIconName');
    const iconOptions = document.querySelectorAll('#pacoteIconList .customIconOption');
    if (selectedIconDisplay) selectedIconDisplay.className = iconeValor;
    iconOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.value === iconeValor) {
            option.classList.add('selected');
            if (selectedIconName) selectedIconName.textContent = option.dataset.name;
        }
    });
}

window.verificarDestaquePacote = async function () {
    const categoria = document.getElementById('pacoteCategoria').value;
    const destaque = document.getElementById('pacoteDestaque').checked;
    const pacoteId = document.getElementById('pacoteId').value;
    const aviso = document.getElementById('destaqueAviso');

    if (!destaque) {
        aviso.classList.remove('show');
        return;
    }

    const { data } = await db.from('pacotes').select('id, nome').eq('categoria', categoria).eq('destaque', true);
    const outroDestaque = data ? data.find(p => p.id !== pacoteId) : null;

    if (outroDestaque) {
        aviso.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Já existe um destaque em "${categoria}": ${outroDestaque.nome}. Ele será substituído.`;
        aviso.classList.add('show');
    } else {
        aviso.classList.remove('show');
    }
}

window.salvarPacote = async function (e) {
    e.preventDefault();
    const id = document.getElementById('pacoteId').value;
    const categoria = document.getElementById('pacoteCategoria').value;
    const destaque = document.getElementById('pacoteDestaque').checked;

    if (destaque) {
        await db.from('pacotes').update({ destaque: false, updated_at: new Date().toISOString() }).eq('categoria', categoria);
    }

    const pacote = {
        categoria: categoria,
        nome: document.getElementById('pacoteNome').value,
        preco: document.getElementById('pacotePreco').value,
        periodo: document.getElementById('pacotePeriodo').value,
        descricao: document.getElementById('pacoteDescricao').value,
        itens: pacoteItensLista.map(item => item.texto),
        icone: document.getElementById('pacoteIcone').value,
        destaque: destaque,
        updated_at: new Date().toISOString()
    };

    try {
        let error;
        if (id) {
            error = (await db.from('pacotes').update(pacote).eq('id', id)).error;
            mostrarToast('Pacote atualizado!', 'sucesso');
        } else {
            error = (await db.from('pacotes').insert([pacote])).error;
            mostrarToast('Pacote adicionado!', 'sucesso');
        }
        if (error) throw error;
        window.limparFormPacote();
        carregarPacotes();
    } catch (error) {
        mostrarToast('Erro: ' + error.message, 'erro');
    }
}

window.editarPacote = async function (id) {
    const { data } = await db.from('pacotes').select('*').eq('id', id).single();
    if (!data) return;
    document.getElementById('pacoteId').value = id;
    document.getElementById('pacoteCategoria').value = data.categoria || 'design';
    document.getElementById('pacoteNome').value = data.nome || '';
    document.getElementById('pacotePreco').value = data.preco || '';
    document.getElementById('pacotePeriodo').value = data.periodo || '';
    document.getElementById('pacoteDescricao').value = data.descricao || '';
    document.getElementById('pacoteIcone').value = data.icone || 'fa-solid fa-box';
    document.getElementById('pacoteDestaque').checked = data.destaque || false;

    pacoteItensLista = (data.itens || []).map((texto, index) => ({ id: Date.now() + index, texto }));
    renderizarItensPacote();

    atualizarDisplayIconePacote(data.icone || 'fa-solid fa-box');
    document.getElementById('tituloFormPacote').textContent = 'Editar Pacote';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.deletarPacote = async function (id) {
    if (!confirm('Deletar este pacote?')) return;
    const { error } = await db.from('pacotes').delete().eq('id', id);
    if (!error) { mostrarToast('Deletado!', 'sucesso'); carregarPacotes(); }
}

window.limparFormPacote = function () {
    document.getElementById('formPacote').reset();
    document.getElementById('pacoteId').value = '';
    document.getElementById('tituloFormPacote').textContent = 'Adicionar Pacote';
    document.getElementById('pacoteIcone').value = 'fa-solid fa-box';
    document.getElementById('destaqueAviso').classList.remove('show');
    atualizarDisplayIconePacote('fa-solid fa-box');
    pacoteItensLista = [];
    renderizarItensPacote();
}

// ===== DEPOIMENTOS =====
const LIMITE_DEPOIMENTOS = 3;

async function carregarDepoimentos() {
    const { data, error } = await db.from('depoimentos').select('*').order('ordem', { ascending: true });
    if (error) return console.error('Erro ao carregar depoimentos:', error);
    renderizarDepoimentos(data);
    const countElement = document.getElementById('countDepoimentos');
    if (countElement) countElement.textContent = data ? data.length : 0;
}

function renderizarDepoimentos(depoimentos) {
    const lista = document.getElementById('listaDepoimentos');
    const countElement = document.getElementById('countDepoimentos');
    if (countElement) countElement.textContent = depoimentos ? depoimentos.length : 0;

    if (!depoimentos || depoimentos.length === 0) {
        lista.innerHTML = '<p style="color: var(--corSuave); text-align: center; padding: 40px;"><i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>Nenhum depoimento cadastrado.</p>';
        return;
    }

    const cores = ['cor-1', 'cor-2', 'cor-3'];

    lista.innerHTML = depoimentos.map((d, index) => {
        const estrelas = parseInt(d.estrelas) || 5;
        const estrelasHTML = Array.from({ length: 5 }, (_, i) =>
            i < estrelas
                ? '<i class="fa-solid fa-star"></i>'
                : '<i class="fa-regular fa-star"></i>'
        ).join('');

        return `
            <div class="itemLista" draggable="true" data-id="${d.id}" data-ordem="${d.ordem || index + 1}" data-index="${index}">
                <div class="dragHandle"><i class="fa-solid fa-grip-vertical"></i></div>
                <div class="depoimentoAvatar ${cores[index % 3]}">${(d.iniciais || '??').toUpperCase()}</div>
                <div class="itemInfo">
                    <h3>${d.nome || 'Sem nome'}</h3>
                    <div class="depoimentoFuncao">${d.funcao || ''}</div>
                    <p class="depoimentoTexto">${d.texto || ''}</p>
                    <div class="depoimentoEstrelas">${estrelasHTML}</div>
                </div>
                <div class="itemAcoes">
                    <button class="btnEditar" onclick="window.editarDepoimento('${d.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btnDeletar" onclick="window.deletarDepoimento('${d.id}')" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
    }).join('');

    setupDragDepoimentos();
}

function setupDragDepoimentos() {
    const items = document.querySelectorAll('#listaDepoimentos .itemLista');
    let draggedItem = null;
    let draggedIndex = null;

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            draggedIndex = parseInt(item.dataset.index);
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (draggedItem && draggedItem !== item) {
                items.forEach(i => i.classList.remove('drag-over'));
                item.classList.add('drag-over');
            }
        });

        item.addEventListener('dragleave', () => { item.classList.remove('drag-over'); });

        item.addEventListener('drop', async (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            if (draggedItem && draggedItem !== item) {
                const targetIndex = parseInt(item.dataset.index);
                if (draggedIndex !== targetIndex) {
                    await reordenarDepoimentos(draggedIndex, targetIndex);
                }
            }
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            items.forEach(i => i.classList.remove('drag-over'));
            draggedItem = null;
            draggedIndex = null;
        });
    });
}

async function reordenarDepoimentos(idxOrigem, idxDestino) {
    try {
        const { data: depoimentos, error } = await db.from('depoimentos').select('id, ordem').order('ordem', { ascending: true });
        if (error) throw error;

        const [movido] = depoimentos.splice(idxOrigem, 1);
        depoimentos.splice(idxDestino, 0, movido);

        const updates = depoimentos.map((d, i) => ({
            id: d.id,
            ordem: i + 1,
            updated_at: new Date().toISOString()
        }));

        const updatePromises = updates.map(update =>
            db.from('depoimentos').update({ ordem: update.ordem, updated_at: update.updated_at }).eq('id', update.id)
        );

        await Promise.all(updatePromises);
        mostrarToast('Ordem atualizada!', 'sucesso');
        await carregarDepoimentos();
    } catch (error) {
        mostrarToast('Erro ao reordenar: ' + error.message, 'erro');
    }
}

window.salvarDepoimento = async function (e) {
    e.preventDefault();

    const { data: depoimentosExistentes } = await db.from('depoimentos').select('id');
    const totalDepoimentos = depoimentosExistentes ? depoimentosExistentes.length : 0;
    const id = document.getElementById('depoimentoId').value;

    if (!id && totalDepoimentos >= LIMITE_DEPOIMENTOS) {
        mostrarToast(`Limite de ${LIMITE_DEPOIMENTOS} depoimentos atingido! Exclua um depoimento para adicionar outro.`, 'erro');
        return;
    }

    const novaOrdem = totalDepoimentos + 1;

    const depoimento = {
        nome: document.getElementById('depoimentoNome').value,
        funcao: document.getElementById('depoimentoFuncao').value,
        texto: document.getElementById('depoimentoTexto').value,
        iniciais: document.getElementById('depoimentoIniciais').value.toUpperCase(),
        estrelas: parseInt(document.getElementById('depoimentoEstrelas').value) || 5,
        ordem: id ? undefined : novaOrdem,
        updated_at: new Date().toISOString()
    };

    try {
        let error;
        if (id) {
            delete depoimento.ordem;
            const response = await db.from('depoimentos').update(depoimento).eq('id', id);
            error = response.error;
            mostrarToast('Depoimento atualizado com sucesso!', 'sucesso');
        } else {
            const response = await db.from('depoimentos').insert([depoimento]);
            error = response.error;
            mostrarToast('Depoimento adicionado com sucesso!', 'sucesso');
        }
        if (error) throw error;
        window.limparFormDepoimento();
        carregarDepoimentos();
    } catch (error) {
        mostrarToast('Erro ao salvar: ' + error.message, 'erro');
    }
}

window.editarDepoimento = async function (id) {
    const { data, error } = await db.from('depoimentos').select('*').eq('id', id).single();
    if (error) return mostrarToast('Erro ao carregar depoimento', 'erro');

    document.getElementById('depoimentoId').value = id;
    document.getElementById('depoimentoNome').value = data.nome || '';
    document.getElementById('depoimentoFuncao').value = data.funcao || '';
    document.getElementById('depoimentoTexto').value = data.texto || '';
    document.getElementById('depoimentoIniciais').value = (data.iniciais || '').toUpperCase();
    document.getElementById('depoimentoEstrelas').value = data.estrelas || 5;

    atualizarEstrelasVisual(data.estrelas || 5);

    document.getElementById('tituloFormDepoimento').textContent = 'Editar Depoimento';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.deletarDepoimento = async function (id) {
    if (!confirm('Tem certeza que deseja deletar este depoimento?')) return;
    try {
        const { error } = await db.from('depoimentos').delete().eq('id', id);
        if (error) throw error;
        mostrarToast('Depoimento deletado!', 'sucesso');
        carregarDepoimentos();
    } catch (error) {
        mostrarToast('Erro ao deletar: ' + error.message, 'erro');
    }
}

window.limparFormDepoimento = function () {
    document.getElementById('formDepoimento').reset();
    document.getElementById('depoimentoId').value = '';
    document.getElementById('depoimentoEstrelas').value = 5;
    document.getElementById('tituloFormDepoimento').textContent = 'Adicionar Depoimento';
    atualizarEstrelasVisual(5);
}

function setupEstrelasSelector() {
    const estrelas = document.querySelectorAll('#estrelasSelector i');
    const inputEstrelas = document.getElementById('depoimentoEstrelas');

    estrelas.forEach(estrela => {
        estrela.addEventListener('click', () => {
            const valor = parseInt(estrela.dataset.valor);
            inputEstrelas.value = valor;
            atualizarEstrelasVisual(valor);
        });

        estrela.addEventListener('mouseenter', () => {
            const valor = parseInt(estrela.dataset.valor);
            destacarEstrelas(valor, true);
        });
    });

    document.getElementById('estrelasSelector').addEventListener('mouseleave', () => {
        const valorAtual = parseInt(inputEstrelas.value) || 5;
        atualizarEstrelasVisual(valorAtual);
    });
}

function atualizarEstrelasVisual(valor) {
    const estrelas = document.querySelectorAll('#estrelasSelector i');
    estrelas.forEach((estrela, index) => {
        if (index < valor) {
            estrela.classList.remove('fa-regular');
            estrela.classList.add('fa-solid', 'ativo');
        } else {
            estrela.classList.remove('fa-solid', 'ativo');
            estrela.classList.add('fa-regular');
        }
    });
}

function destacarEstrelas(valor) {
    const estrelas = document.querySelectorAll('#estrelasSelector i');
    estrelas.forEach((estrela, index) => {
        if (index < valor) {
            estrela.classList.add('fa-solid');
            estrela.classList.remove('fa-regular');
        } else {
            estrela.classList.remove('fa-solid');
            estrela.classList.add('fa-regular');
        }
    });
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('senhaInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') window.fazerLogin(); });
    document.getElementById('emailInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('senhaInput').focus(); });

    const novoItemInput = document.getElementById('novoItemInput');
    if (novoItemInput) { novoItemInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); window.adicionarItem(); } }); }

    const novoItemPacoteInput = document.getElementById('novoItemPacoteInput');
    if (novoItemPacoteInput) { novoItemPacoteInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); window.adicionarItemPacote(); } }); }

    setupIconDropdown();
    setupPacoteIconDropdown();
    setupCapaDropZone();
    setupImagensDropZone();
    setupEstrelasSelector();
    verificarSessao();
    setupUnsavedChangesDetection();
});