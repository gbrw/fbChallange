// التطبيق الرئيسي - إعداد معالجات الأحداث وتكامل الوظائف

document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل الصفحة - إعداد معالجات الأحداث');
    
    // معالج إنشاء غرفة
    document.getElementById('create-room-btn').addEventListener('click', function() {
        console.log('تم النقر على زر إنشاء غرفة');
        
        const playerName = document.getElementById('player-name').value.trim();
        if (!playerName) {
            showToast('يرجى إدخال اسم اللاعب', 'error');
            return;
        }
        
        // إنشاء غرفة جديدة
        createRoom(playerName).then(roomCode => {
            console.log('تم إنشاء الغرفة بنجاح، الرمز:', roomCode);
            
            // عرض معلومات الغرفة
            document.getElementById('room-code-display').textContent = roomCode;
            document.getElementById('created-room-info').classList.remove('hidden');
            document.getElementById('join-room-form').classList.add('hidden');
            
            // تهيئة اللعبة
            initGame(roomCode, 'player1', true);
            
            // بعد ثانيتين، إظهار شاشة الانتظار
            setTimeout(() => {
                showScreen('waiting-screen');
                showToast('تم إنشاء الغرفة بنجاح! انتظر انضمام اللاعب الآخر', 'success');
            }, 2000);
        }).catch(error => {
            console.error('خطأ في إنشاء الغرفة:', error);
            showToast('حدث خطأ أثناء إنشاء الغرفة: ' + error.message, 'error');
        });
    });
    
    // معالج إظهار نموذج الانضمام
    document.getElementById('join-room-btn').addEventListener('click', function() {
        console.log('تم النقر على زر الانضمام إلى غرفة');
        
        document.getElementById('created-room-info').classList.add('hidden');
        document.getElementById('join-room-form').classList.remove('hidden');
    });
    
    // معالج الانضمام إلى غرفة
    document.getElementById('confirm-join-btn').addEventListener('click', function() {
        console.log('تم النقر على زر تأكيد الانضمام');
        
        const playerName = document.getElementById('player-name').value.trim();
        const roomCode = document.getElementById('room-code').value.trim().toUpperCase();
        
        if (!playerName) {
            showJoinStatus('يرجى إدخال اسم اللاعب', 'error');
            return;
        }
        
        if (!roomCode) {
            showJoinStatus('يرجى إدخال رمز الغرفة', 'error');
            return;
        }
        
        // تعطيل الزر ومؤشر تحميل
        const confirmJoinBtn = document.getElementById('confirm-join-btn');
        confirmJoinBtn.disabled = true;
        confirmJoinBtn.textContent = 'جارِ الانضمام...';
        showJoinStatus('جارِ الانضمام...', 'info');
        
        // محاولة الانضمام
        joinRoom(roomCode, playerName).then(() => {
            console.log('تم الانضمام إلى الغرفة بنجاح');
            
            // تهيئة اللعبة
            initGame(roomCode, 'player2', false);
            
            // إظهار شاشة اللعبة
            showScreen('game-screen');
            showToast('تم الانضمام إلى الغرفة بنجاح!', 'success');
        }).catch(error => {
            console.error('خطأ في الانضمام إلى الغرفة:', error);
            showJoinStatus('حدث خطأ: ' + error.message, 'error');
        }).finally(() => {
            // إعادة تفعيل الزر
            confirmJoinBtn.disabled = false;
            confirmJoinBtn.textContent = 'انضمام';
        });
    });
    
    // إضافة معالج حدث الضغط على Enter في حقل رمز الغرفة
    document.getElementById('room-code').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('confirm-join-btn').click();
        }
    });
    
    // معالجات جولة المعرفة
    document.getElementById('submit-knowledge').addEventListener('click', function() {
        const answer = document.getElementById('knowledge-answer').value.trim();
        handleKnowledgeAnswer(answer);
    });
    
    document.getElementById('pass-knowledge').addEventListener('click', function() {
        handleKnowledgePass();
    });
    
    // معالج حدث الضغط على Enter في حقل إجابة المعرفة
    document.getElementById('knowledge-answer').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('submit-knowledge').click();
        }
    });
    
    // معالجات جولة الجرس
    document.getElementById('bell-button').addEventListener('click', function() {
        handleBellRing();
    });
    
    document.getElementById('submit-bell-answer').addEventListener('click', function() {
        const answer = document.getElementById('bell-answer').value.trim();
        handleBellAnswer(answer);
    });
    
    // معالج حدث الضغط على Enter في حقل إجابة الجرس
    document.getElementById('bell-answer').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('submit-bell-answer').click();
        }
    });
    
    // معالجات جولة المسيرة
    document.getElementById('submit-career').addEventListener('click', function() {
        const answer = document.getElementById('career-answer').value.trim();
        handleCareerAnswer(answer);
    });
    
    // معالج حدث الضغط على Enter في حقل إجابة المسيرة
    document.getElementById('career-answer').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('submit-career').click();
        }
    });
    
    // معالج "اللعب مرة أخرى"
    document.getElementById('play-again-btn').addEventListener('click', function() {
        handlePlayAgain();
    });
    
    // تسجيل النجاح
    console.log('تم إعداد جميع معالجات الأحداث بنجاح');
});