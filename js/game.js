// آليات اللعبة

// حالة اللعبة
const gameState = {
    roomCode: null,
    playerId: null, // 'player1' أو 'player2'
    isCreator: false,
    players: {},
    currentRound: 1,
    currentQuestion: 1,
    currentTurn: 'player1',
    gameRef: null,
    attempts: 3
};

// إظهار شاشة معينة وإخفاء البقية
function showScreen(screenId) {
    console.log('عرض الشاشة:', screenId);
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// عرض رسالة للمستخدم
function showToast(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    alert(message);
}

// عرض رسالة في قسم حالة الانضمام
function showJoinStatus(message, type = 'info') {
    const statusElement = document.getElementById('join-status');
    if (statusElement) {
        statusElement.innerHTML = `<div class="${type}">${message}</div>`;
    }
}

// تحديث واجهة المستخدم بناءً على بيانات الغرفة
function updateUI(roomData) {
    // تحديث أسماء اللاعبين والنتائج
    const players = roomData.players || {};
    const gameStateData = roomData.gameState || {};
    
    // تحديث معلومات اللاعب 1
    if (players.player1) {
        document.querySelectorAll('#player1-name').forEach(el => {
            el.textContent = players.player1.name;
        });
        document.querySelectorAll('#player1-score').forEach(el => {
            el.textContent = players.player1.score || 0;
        });
    }
    
    // تحديث معلومات اللاعب 2
    if (players.player2) {
        document.querySelectorAll('#player2-name').forEach(el => {
            el.textContent = players.player2.name;
        });
        document.querySelectorAll('#player2-score').forEach(el => {
            el.textContent = players.player2.score || 0;
        });
    }
    
    // تحديث معلومات الجولة
    const currentRound = gameStateData.currentRound || 1;
    const currentQuestion = gameStateData.currentQuestion || 1;
    const currentTurn = gameStateData.currentTurn || 'player1';
    
    document.getElementById('current-round').textContent = currentRound;
    
    // تحديث دور اللاعب الحالي
    document.getElementById('current-turn').textContent = 
        players[currentTurn] ? players[currentTurn].name : 'غير معروف';
    
    // تحديد إذا كان دور اللاعب الحالي
    const isPlayerTurn = currentTurn === gameState.playerId;
    
    // تفعيل/تعطيل أزرار الإجابة بناءً على الدور
    const answerButtons = document.querySelectorAll('.answer-section button');
    answerButtons.forEach(btn => {
        btn.disabled = !isPlayerTurn;
    });
    
    // تحديث عرض السؤال بناءً على الجولة الحالية
    updateQuestionDisplay(currentRound, currentQuestion - 1);
    
    // إذا انتهت اللعبة
    if (roomData.status === 'completed') {
        showResultsScreen(players);
    }
}

// تحديث عرض السؤال بناءً على الجولة والسؤال الحاليين
function updateQuestionDisplay(roundNumber, questionIndex) {
    // إخفاء جميع أقسام الجولات
    document.querySelectorAll('.round-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    let roundType;
    let questionElement;
    
    // تحديد نوع الجولة
    switch (roundNumber) {
        case 1:
            roundType = 'knowledge';
            questionElement = document.getElementById('knowledge-question');
            document.getElementById('knowledge-round').classList.remove('hidden');
            break;
        case 2:
            roundType = 'auction';
            questionElement = document.getElementById('auction-question');
            document.getElementById('auction-round').classList.remove('hidden');
            break;
        case 3:
            roundType = 'bell';
            questionElement = document.getElementById('bell-question');
            document.getElementById('bell-round').classList.remove('hidden');
            break;
        case 4:
            roundType = 'career';
            questionElement = document.getElementById('career-question');
            document.getElementById('career-round').classList.remove('hidden');
            break;
        default:
            return;
    }
    
    // الحصول على السؤال وعرضه
    const question = getQuestion(roundType, questionIndex);
    if (question && questionElement) {
        questionElement.textContent = question.question;
    }
    
    // إعادة تعيين حقول الإدخال
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.value = '';
    });
    
    // إخفاء أقسام محددة حسب الجولة
    if (roundType === 'bell') {
        document.getElementById('bell-answer-section').classList.add('hidden');
    }
    
    // تحديث المحاولات المتبقية
    document.getElementById('attempts-left').textContent = gameState.attempts;
}

// عرض شاشة النتائج
function showResultsScreen(players) {
    // تحديث أسماء ونتائج اللاعبين في شاشة النتائج
    document.getElementById('result-player1-name').textContent = players.player1?.name || 'اللاعب 1';
    document.getElementById('result-player1-score').textContent = players.player1?.score || 0;
    
    document.getElementById('result-player2-name').textContent = players.player2?.name || 'اللاعب 2';
    document.getElementById('result-player2-score').textContent = players.player2?.score || 0;
    
    // تحديد الفائز
    const winner = determineWinner(players);
    document.getElementById('winner-announcement').textContent = winner;
    
    // إظهار شاشة النتائج
    showScreen('results-screen');
}

// تحديد الفائز
function determineWinner(players) {
    const score1 = players.player1?.score || 0;
    const score2 = players.player2?.score || 0;
    
    if (score1 > score2) {
        return `الفائز: ${players.player1?.name}! 🎉`;
    } else if (score2 > score1) {
        return `الفائز: ${players.player2?.name}! 🎉`;
    } else {
        return 'تعادل! 🤝';
    }
}

// تهيئة اللعبة
function initGame(roomCode, playerId, isCreator) {
    gameState.roomCode = roomCode;
    gameState.playerId = playerId;
    gameState.isCreator = isCreator;
    gameState.attempts = 3;
    
    // تحديث رمز الغرفة في شاشة الانتظار
    document.getElementById('waiting-room-code').textContent = roomCode;
    
    // الاستماع للتغييرات في الغرفة
    gameState.gameRef = listenToRoomChanges(roomCode, {
        onRoomUpdate: handleRoomUpdate,
        onRoomDeleted: handleRoomDeleted
    });
}

// معالج تحديث الغرفة
function handleRoomUpdate(roomData) {
    console.log('تم تحديث بيانات الغرفة:', roomData);
    
    // تحديث حالة اللعبة المحلية
    gameState.players = roomData.players || {};
    if (roomData.gameState) {
        gameState.currentRound = roomData.gameState.currentRound || 1;
        gameState.currentQuestion = roomData.gameState.currentQuestion || 1;
        gameState.currentTurn = roomData.gameState.currentTurn || 'player1';
    }
    
    // تحديث واجهة المستخدم
    updateUI(roomData);
    
    // التحقق من حالة الغرفة
    if (roomData.status === 'ready' && gameState.isCreator) {
        showScreen('game-screen');
    } else if (roomData.status === 'ready' && !gameState.isCreator) {
        showScreen('game-screen');
    }
}

// معالج حذف الغرفة
function handleRoomDeleted() {
    console.log('تم حذف الغرفة');
    showToast('انتهت اللعبة لأن اللاعب الآخر غادر', 'error');
    showScreen('welcome-screen');
}

// معالجة تقديم إجابة جولة المعرفة
function handleKnowledgeAnswer(answer) {
    if (!answer) {
        showToast('يرجى إدخال إجابة', 'error');
        return;
    }
    
    const questionIndex = gameState.currentQuestion - 1;
    const isCorrect = validateKnowledgeAnswer(answer, questionIndex);
    
    if (isCorrect) {
        showToast('إجابة صحيحة! 🎉', 'success');
        
        // تحديث النتيجة
        updatePlayerScore(gameState.roomCode, gameState.playerId, 1)
            .then(() => moveToNextQuestion(gameState.roomCode))
            .catch(error => console.error('خطأ في تحديث النتيجة:', error));
    } else {
        showToast('إجابة خاطئة', 'error');
        
        // تقليل عدد المحاولات
        gameState.attempts--;
        document.getElementById('attempts-left').textContent = gameState.attempts;
        
        // إذا نفدت المحاولات، ينتقل الدور للاعب الآخر
        if (gameState.attempts <= 0) {
            showToast('انتهت المحاولات، دور اللاعب الآخر', 'info');
            gameState.attempts = 3; // إعادة تعيين المحاولات
            
            // تغيير الدور
            const nextPlayer = gameState.playerId === 'player1' ? 'player2' : 'player1';
            updateGameTurn(gameState.roomCode, nextPlayer)
                .catch(error => console.error('خطأ في تغيير الدور:', error));
        }
    }
}

// معالجة تمرير الدور في جولة المعرفة
function handleKnowledgePass() {
    showToast('تم تمرير الدور', 'info');
    gameState.attempts = 3; // إعادة تعيين المحاولات
    
    // تغيير الدور
    const nextPlayer = gameState.playerId === 'player1' ? 'player2' : 'player1';
    updateGameTurn(gameState.roomCode, nextPlayer)
        .catch(error => console.error('خطأ في تغيير الدور:', error));
}

// معالجة ضغط الجرس
function handleBellRing() {
    showToast('تم ضغط الجرس! أدخل إجابتك الآن', 'info');
    document.getElementById('bell-answer-section').classList.remove('hidden');
}

// معالجة تقديم إجابة الجرس
function handleBellAnswer(answer) {
    if (!answer) {
        showToast('يرجى إدخال إجابة', 'error');
        return;
    }
    
    const questionIndex = gameState.currentQuestion - 1;
    const isCorrect = validateBellAnswer(answer, questionIndex);
    
    if (isCorrect) {
        showToast('إجابة صحيحة! 🔔', 'success');
        
        // تحديث النتيجة وانتقال للسؤال التالي
        updatePlayerScore(gameState.roomCode, gameState.playerId, 1)
            .then(() => moveToNextQuestion(gameState.roomCode))
            .catch(error => console.error('خطأ:', error));
    } else {
        showToast('إجابة خاطئة', 'error');
        
        // تغيير الدور
        const nextPlayer = gameState.playerId === 'player1' ? 'player2' : 'player1';
        updateGameTurn(gameState.roomCode, nextPlayer)
            .catch(error => console.error('خطأ في تغيير الدور:', error));
    }
    
    // إخفاء قسم الإجابة
    document.getElementById('bell-answer-section').classList.add('hidden');
}

// معالجة تقديم إجابة المسيرة
function handleCareerAnswer(answer) {
    if (!answer) {
        showToast('يرجى إدخال إجابة', 'error');
        return;
    }
    
    const questionIndex = gameState.currentQuestion - 1;
    const isCorrect = validateCareerAnswer(answer, questionIndex);
    
    if (isCorrect) {
        showToast('إجابة صحيحة! 🌟', 'success');
        
        // تحديث النتيجة وانتقال للسؤال التالي
        updatePlayerScore(gameState.roomCode, gameState.playerId, 1)
            .then(() => moveToNextQuestion(gameState.roomCode))
            .catch(error => console.error('خطأ:', error));
    } else {
        showToast('إجابة خاطئة', 'error');
        
        // تقليل عدد المحاولات
        gameState.attempts--;
        document.getElementById('attempts-left').textContent = gameState.attempts;
        
        // إذا نفدت المحاولات، ينتقل الدور للاعب الآخر
        if (gameState.attempts <= 0) {
            showToast('انتهت المحاولات، دور اللاعب الآخر', 'info');
            gameState.attempts = 3; // إعادة تعيين المحاولات
            
            // تغيير الدور
            const nextPlayer = gameState.playerId === 'player1' ? 'player2' : 'player1';
            updateGameTurn(gameState.roomCode, nextPlayer)
                .catch(error => console.error('خطأ في تغيير الدور:', error));
        }
    }
}

// معالجة "اللعب مرة أخرى"
function handlePlayAgain() {
    showScreen('welcome-screen');
    resetGame();
}

// إعادة تعيين اللعبة
function resetGame() {
    // إلغاء الاشتراك في تغييرات الغرفة
    if (gameState.gameRef) {
        gameState.gameRef.unsubscribe();
    }
    
    // إعادة تعيين حالة اللعبة
    gameState.roomCode = null;
    gameState.playerId = null;
    gameState.isCreator = false;
    gameState.players = {};
    gameState.currentRound = 1;
    gameState.currentQuestion = 1;
    gameState.currentTurn = 'player1';
    gameState.gameRef = null;
    gameState.attempts = 3;
    
    // إعادة تعيين واجهة المستخدم
    document.getElementById('player-name').value = '';
    document.getElementById('room-code').value = '';
    document.getElementById('join-status').innerHTML = '';
    document.getElementById('created-room-info').classList.add('hidden');
    document.getElementById('join-room-form').classList.add('hidden');
}