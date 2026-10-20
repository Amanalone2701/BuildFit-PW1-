let currentTimer = null;
let timeRemaining = 0;
let currentExerciseElement = null;

// ====== LÓGICA DE DRAG & DROP ======
function iniciarDragAndDrop() {
    const draggables = document.querySelectorAll('.drag-item:not(.drag-initialized)');
    const dropZones = document.querySelectorAll('.drop-zone:not(.drop-initialized)');

    draggables.forEach(draggable => {
        draggable.classList.add('drag-initialized');
        draggable.addEventListener('dragstart', () => draggable.classList.add('dragging'));
        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            salvarEstadoAPI();
        });
    });

    dropZones.forEach(zone => {
        zone.classList.add('drop-initialized');
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const draggingItem = document.querySelector('.dragging');
            if (draggingItem) {
                const clone = draggingItem.cloneNode(true);
                clone.classList.remove('dragging');
                clone.classList.remove('drag-initialized'); 
                
                if(!clone.querySelector('.btn-delete')) {
                    clone.innerHTML += ` <button class="btn-delete" onclick="event.stopPropagation(); deletarElemento(this)">x</button>`;
                }
                zone.appendChild(clone);
                
                iniciarDragAndDrop();
                salvarEstadoAPI();
            }
        });
    });
}

// ====== ADICIONAR E DELETAR ELEMENTOS ======
function adicionarNovo(tipo) {
    const nome = prompt(`Digite o nome do novo ${tipo}:`);
    if (!nome) return;

    if(tipo === 'coluna-treino') {
        const trTreinos = document.getElementById('linha-treinos');
        const trDrop = document.getElementById('linha-drop-exercicios');
        
        const th = document.createElement('th');
        th.innerHTML = `<div class="p-2 border border-secondary text-center">${nome} <button class="btn-delete" onclick="deletarColunaTreino(this)">x</button></div>`;
        trTreinos.appendChild(th);
        
        const td = document.createElement('td');
        td.innerHTML = `<div class="drop-zone mt-2"></div>`;
        trDrop.appendChild(td);
        
        iniciarDragAndDrop();
        salvarEstadoAPI();
        return;
    }

    let areaMuscular = 'Músculo';
    if (tipo === 'exercicio') {
        areaMuscular = prompt(`Qual a área muscular do exercício "${nome}"? (Ex: Peito, Pernas, Costas)`);
        if (!areaMuscular) areaMuscular = 'Área não definida'; 
    }

    const container = tipo === 'treino' ? document.getElementById('lista-treinos') : document.getElementById('lista-exercicios');
    const div = document.createElement('div');
    div.className = 'drag-item' + (tipo === 'exercicio' ? ' exercicio-item' : '');
    div.draggable = true;
    
    if(tipo === 'exercicio') {
        div.setAttribute('onclick', `abrirModal(this, '${nome}', '${areaMuscular}', 'https://www.youtube.com/embed/cZ75YmWYTgQ?autoplay=1&mute=1&loop=1&playlist=cZ75YmWYTgQ')`);
    }

    div.innerHTML = `<span>${nome}</span> <span class="timer-display text-warning ms-2" style="display:none; font-size:12px;"></span> <button class="btn-delete" onclick="event.stopPropagation(); deletarElemento(this)">x</button>`;
    
    container.appendChild(div);
    iniciarDragAndDrop();
    salvarEstadoAPI();
}

function deletarElemento(botao) {
    if (confirm("Deseja excluir este item?")) {
        botao.parentElement.remove();
        salvarEstadoAPI();
    }
}

function deletarColunaTreino(botao) {
    if(confirm("Excluir esta coluna de treino?")) {
        const th = botao.closest('th');
        const index = Array.from(th.parentNode.children).indexOf(th);
        th.remove();
        document.getElementById('linha-drop-exercicios').children[index].remove();
        salvarEstadoAPI();
    }
}

// ====== LÓGICA DO MODAL E TIMER ======
function abrirModal(elemento, nome, area, videoSrc) {
    currentExerciseElement = elemento;
    document.getElementById('modalNome').innerText = nome;
    document.getElementById('modalArea').innerText = area;
    
    const videoContainer = document.getElementById('videoContainer');
    videoContainer.innerHTML = `<iframe width="100%" height="100%" src="${videoSrc}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius: 8px;"></iframe>`;
    
    document.getElementById('exerciseModal').style.display = 'flex';
}

function fecharModal() { 
    document.getElementById('exerciseModal').style.display = 'none';
    document.getElementById('videoContainer').innerHTML = ''; 
}

function toggleTimer() {
    const btn = document.getElementById('btnToggleTimer');
    const inputTempo = document.getElementById('inputTempoDescanso');
    
    if (currentTimer) {
        clearInterval(currentTimer);
        currentTimer = null;
        btn.innerText = "▶";
    } else {
        if(timeRemaining <= 0) timeRemaining = parseInt(inputTempo.value);
        btn.innerText = "⏸";
        
        currentTimer = setInterval(() => {
            timeRemaining--;
            atualizarRelogios();
            
            if(timeRemaining <= 0) {
                clearInterval(currentTimer);
                currentTimer = null;
                btn.innerText = "▶";
                
                if(currentExerciseElement) {
                    const badge = currentExerciseElement.querySelector('.timer-display');
                    if(badge) badge.style.display = 'none';
                }
                alert("Descanso finalizado!");
            }
        }, 1000);
    }
}

function atualizarRelogios() {
    const min = String(Math.floor(timeRemaining / 60)).padStart(2, '0');
    const sec = String(timeRemaining % 60).padStart(2, '0');
    document.getElementById('timerModalDisplay').innerText = `${min}:${sec}`;
    
    if(currentExerciseElement) {
        const badge = currentExerciseElement.querySelector('.timer-display');
        if(badge) {
            if(timeRemaining > 0) {
                badge.style.display = 'inline';
                badge.innerText = `⏱ ${min}:${sec}`;
            } else {
                badge.style.display = 'none';
            }
        }
    }
}

// ====== SALVAMENTO SEGURO ======
function salvarEstadoAPI() {
    if(!document.getElementById('lista-treinos')) return; 

    const containerTreinos = document.getElementById('lista-treinos').cloneNode(true);
    const containerExercicios = document.getElementById('lista-exercicios').cloneNode(true);
    const tabelaCronograma = document.getElementById('tabela-cronograma').cloneNode(true);
    const tabelaPreenchido = document.getElementById('tabela-treino-preenchido').cloneNode(true);

    [containerTreinos, containerExercicios, tabelaCronograma, tabelaPreenchido].forEach(container => {
        container.querySelectorAll('.timer-display').forEach(el => {
            el.style.display = 'none'; 
            el.innerText = '';
        });
        // LIMPANDO AS "TRAVAS" ANTES DE SALVAR
        container.querySelectorAll('.drag-initialized').forEach(el => el.classList.remove('drag-initialized'));
        container.querySelectorAll('.drop-initialized').forEach(el => el.classList.remove('drop-initialized'));
        container.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
        container.querySelectorAll('.dragover').forEach(el => el.classList.remove('dragover'));
    });

    const dados = {
        htmlTreinos: containerTreinos.innerHTML,
        htmlExercicios: containerExercicios.innerHTML,
        htmlCronograma: tabelaCronograma.innerHTML,
        htmlTreinoPreenchido: tabelaPreenchido.innerHTML
    };
    
    fetch('/api/salvar-estado', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(dados)
    });
}

// ====== INICIALIZAÇÃO ======
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.timer-display').forEach(el => {
        el.style.display = 'none';
        el.innerText = '';
    });
    
    // CORREÇÃO DO BUG: Se você recarregou a página, isso força a remover 
    // as travas velhas que já estavam salvas no seu data.json!
    document.querySelectorAll('.drag-initialized').forEach(el => el.classList.remove('drag-initialized'));
    document.querySelectorAll('.drop-initialized').forEach(el => el.classList.remove('drop-initialized'));
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.dragover').forEach(el => el.classList.remove('dragover'));

    // Agora liga tudo limpinho
    iniciarDragAndDrop();
});

// ====== PERFIL E CONTA ======
function toggleSenha(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === "password" ? "text" : "password";
}

async function atualizarPerfilCampo(campo) {
    let valor = prompt(`Novo ${campo}:`);
    if(valor) {
        await fetch('/api/atualizar-perfil', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({[campo]: valor}) });
        location.reload();
    }
}

function abrirModalSenha() { document.getElementById('modalSenha').style.display = 'flex'; }
function fecharModalSenha() { document.getElementById('modalSenha').style.display = 'none'; }

async function salvarNovaSenha() {
    const sAtual = document.getElementById('sAtual').value;
    const sNova = document.getElementById('sNova').value;
    const sConfirma = document.getElementById('sConfirma').value;
    const res = await fetch('/api/atualizar-perfil', { 
        method: 'POST', headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({senhaAtual: sAtual, novaSenha: sNova, confirmaNovaSenha: sConfirma}) 
    });
    const data = await res.json();
    if(data.success) { alert("Senha alterada!"); fecharModalSenha(); }
    else { alert(data.msg); }
}

const fotoInput = document.getElementById('fotoInput');
if (fotoInput) {
    fotoInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                const base64 = e.target.result;
                document.getElementById('profilePreview').src = base64;
                await fetch('/api/atualizar-perfil', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({foto: base64}) });
            };
            reader.readAsDataURL(file);
        }
    });
}