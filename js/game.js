// منطق اللعبة الرئيسي - النسخة النهائية مع إصلاح المؤقت والسترايك

document.addEventListener('DOMContentLoaded', function() {
    // التأكد من وجود معلومات اللاعب
    if (!checkPlayerInfo()) return;
    
    // الحصول على معلومات اللاعب والغرفة
    const roomCode = localStorage.getItem('roomCode');
    const playerName = localStorage.getItem('playerName');
    const playerId = localStorage.getItem('playerId');
    const isCreator = localStorage.getItem('isCreator') === 'true';
    
    let currentQuestion = 0;
    let gameQuestions = [];
    let opponentId = playerId === 'player1' ? 'player2' : 'player1';
    
    // مراجع العناصر
    const timerElement = document.getElementById('timer');
    const questionElement = document.getElementById('current-question');
    const questionNumberElement = document.getElementById('question-number');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-answer');
    const skipButton = document.getElementById('skip-question');
    const gameStatus = document.getElementById('game-status');
    
    // مراجع معلومات اللاعبين
    const player1Name = document.getElementById('player1-name');
    const player1Score = document.getElementById('player1-score');
    const player1Strikes = document.getElementById('player1-strikes');
    const player2Name = document.getElementById('player2-name');
    const player2Score = document.getElementById('player2-score');
    const player2Strikes = document.getElementById('player2-strikes');
    
    // العناصر الحاوية للاعبين
    const player1Container = document.getElementById('player1-container');
    const player2Container = document.getElementById('player2-container');
    
    // مؤقت محلي للتحكم في الوقت
    let timerInterval = null;
    
    // مرجع الغرفة
    const roomRef = database.ref('rooms/' + roomCode);
    
    // مراجع لمكونات اللعبة في Firebase
    const gameStateRef = roomRef.child('gameState');
    const currentTurnRef = gameStateRef.child('currentTurn');
    const timerRef = gameStateRef.child('timer');
    
    // الاستماع للتغييرات في الغرفة
    roomRef.on('value', function(snapshot) {
        if (!snapshot.exists()) {
            alert('تم حذف الغرفة. سيتم توجيهك إلى الصفحة الرئيسية.');
            window.location.href = 'index.html';
            return;
        }
        
        const roomData = snapshot.val();
        
        // تحديث معلومات اللاعبين
        updatePlayersInfo(roomData.players);
        
        // التحقق من حالة اللعبة
        const gameState = roomData.gameState || {};
        
        // حفظ الأسئلة
        if (gameState.questions) {
            gameQuestions = Object.values(gameState.questions);
        }
        
        // تحديث رقم السؤال الحالي
        if (gameState.currentQuestion !== undefined) {
            currentQuestion = gameState.currentQuestion;
            questionNumberElement.textContent = currentQuestion + 1;
            
            // التحقق من انتهاء الأسئلة
            if (currentQuestion >= 5) {
                // انتهاء الجولة، الانتقال إلى صفحة النتائج
                window.location.href = 'results.html?room=' + roomCode;
                return;
            }
            
            // عرض السؤال الحالي
            if (gameQuestions[currentQuestion]) {
                questionElement.textContent = gameQuestions[currentQuestion].question;
            }
        }
        
        // التحقق من دور اللاعب الحالي
        const currentTurn = gameState.currentTurn;
        updateTurnUI(currentTurn);
        
        // إذا كان الدور دور اللاعب الحالي، تفعيل عناصر الإدخال
        const isPlayerTurn = currentTurn === playerId;
        answerInput.disabled = !isPlayerTurn;
        submitButton.disabled = !isPlayerTurn;
        
        // تحديث زر السكيب (يمكن استخدامه مرة واحدة لكل سؤال)
        const skipUsed = roomData.gameState?.skipUsed?.[playerId]?.[currentQuestion] || false;
        skipButton.disabled = !isPlayerTurn || skipUsed;
        
        // تحديث المؤقت مع بيانات من Firebase
        updateTimerDisplay(gameState.timer);
        
        // التحقق من انتهاء الوقت
        if (gameState.timer && gameState.timer.expired) {
            // إظهار إشعار انتهاء الوقت لجميع اللاعبين
            showTimeoutMessage();
        }
        
        // إذا انتقل الدور للاعب الحالي وليس هناك مؤقت نشط
        if (isPlayerTurn && (!gameState.timer || !gameState.timer.active)) {
            // ابدأ مؤقت جديد
            if (!gameState.timer || !gameState.timer.expired) {
                startNewTurn();
            }
        }
    });
    
    // تحديث معلومات اللاعبين
    function updatePlayersInfo(players) {
        if (players.player1) {
            player1Name.textContent = players.player1.name;
            player1Score.textContent = players.player1.score || 0;
            player1Strikes.textContent = '✗'.repeat(players.player1.strikes || 0);
        }
        
        if (players.player2) {
            player2Name.textContent = players.player2.name;
            player2Score.textContent = players.player2.score || 0;
            player2Strikes.textContent = '✗'.repeat(players.player2.strikes || 0);
        }
    }
    
    // تحديث واجهة الدور
    function updateTurnUI(currentTurn) {
        player1Container.classList.remove('active');
        player2Container.classList.remove('active');
        
        if (currentTurn === 'player1') {
            player1Container.classList.add('active');
        } else if (currentTurn === 'player2') {
            player2Container.classList.add('active');
        }
    }
    
    // تحديث عرض المؤقت
    function updateTimerDisplay(timerData) {
        if (!timerData) return;
        
        // تحديث عرض المؤقت لجميع اللاعبين
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // عرض الوقت المتبقي
        const timeLeft = timerData.timeLeft || 0;
        timerElement.textContent = timeLeft;
        
        // تغيير لون المؤقت حسب الوقت المتبقي
        if (timeLeft <= 3) {
            timerElement.style.backgroundColor = '#F24C4C';
        } else {
            timerElement.style.backgroundColor = '#22A699';
        }
        
        // إذا كان المؤقت نشطًا، قم بتحديثه محليًا للعرض فقط
        if (timerData.active && timeLeft > 0) {
            const endTime = timerData.endTime;
            const currentTime = Date.now();
            let remainingTime = Math.max(0, Math.floor((endTime - currentTime) / 1000));
            
            // تحديث العرض المحلي فقط
            timerElement.textContent = remainingTime;
            
            timerInterval = setInterval(() => {
                const now = Date.now();
                remainingTime = Math.max(0, Math.floor((endTime - now) / 1000));
                
                // تحديث العرض فقط (لا يؤثر على Firebase)
                timerElement.textContent = remainingTime;
                
                // تغيير اللون عند اقتراب الوقت من النهاية
                if (remainingTime <= 3) {
                    timerElement.style.backgroundColor = '#F24C4C';
                }
                
                // إذا انتهى الوقت وكان دور اللاعب الحالي
                if (remainingTime === 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    
                    // فقط اللاعب الذي حان دوره يعالج انتهاء الوقت في Firebase
                    if (timerData.turnPlayerId === playerId) {
                        // تأكد من أنه لا يزال دور هذا اللاعب
                        currentTurnRef.once('value', function(turnSnapshot) {
                            if (turnSnapshot.val() === playerId) {
                                handleTimeout();
                            }
                        });
                    }
                }
            }, 100);
        }
    }
    
    // بدء دور جديد
    function startNewTurn() {
        showStatus('دورك! لديك 8 ثوانٍ للإجابة', 'info');
        answerInput.value = '';
        answerInput.focus();
        
        // تحديث بيانات المؤقت في Firebase
        timerRef.set({
            timeLeft: 8,
            active: true,
            endTime: Date.now() + 8000,
            expired: false,
            turnPlayerId: playerId // تخزين معرف اللاعب الذي بدأ المؤقت
        });
    }
    
    // معالجة انتهاء الوقت
    function handleTimeout() {
        console.log('معالجة انتهاء الوقت...');
        
        // تحديث حالة المؤقت في Firebase
        timerRef.update({
            active: false,
            timeLeft: 0,
            expired: true
        }).then(() => {
            console.log('تم تحديث حالة المؤقت، جاري إضافة سترايك...');
            
            // إضافة سترايك بعد تحديث المؤقت
            roomRef.transaction(function(data) {
                if (!data) return data;
                
                // الحصول على معرف اللاعب الذي انتهى وقته
                const turnPlayerId = data.gameState.currentTurn;
                
                // زيادة عدد السترايكات
                const strikes = (data.players[turnPlayerId]?.strikes || 0) + 1;
                data.players[turnPlayerId].strikes = strikes;
                
                console.log(`إضافة سترايك للاعب ${turnPlayerId}: ${strikes}`);
                
                // إذا وصل عدد السترايكات إلى 3
                if (strikes >= 3) {
                    // تحديد اللاعب الخصم
                    const opponentId = turnPlayerId === 'player1' ? 'player2' : 'player1';
                    
                    // إضافة نقطة للخصم
                    data.players[opponentId].score = (data.players[opponentId]?.score || 0) + 1;
                    
                    // إعادة تعيين السترايكات لكلا اللاعبين
                    data.players.player1.strikes = 0;
                    data.players.player2.strikes = 0;
                    
                    // الانتقال إلى السؤال التالي
                    data.gameState.currentQuestion += 1;
                    
                    // التحقق من انتهاء الأسئلة
                    if (data.gameState.currentQuestion >= 5) {
                        data.gameState.roundCompleted = true;
                    }
                    
                    // إعادة تعيين الإجابات المستخدمة
                    data.gameState.usedAnswers = {};
                    
                    // إعادة تعيين السكيب لكلا اللاعبين للسؤال القادم
                    if (!data.gameState.skipUsed) data.gameState.skipUsed = {};
                }
                
                // تغيير الدور
                const nextPlayer = turnPlayerId === 'player1' ? 'player2' : 'player1';
                data.gameState.currentTurn = nextPlayer;
                
                // إعادة تعيين المؤقت
                if (!data.gameState.timer) data.gameState.timer = {};
                data.gameState.timer.active = false;
                
                return data;
            }).then(() => {
                console.log('تمت إضافة السترايك وتحديث اللعبة');
                // التحقق من انتهاء الجولة
                checkRoundCompletion();
            });
        });
    }
    
    // عرض رسالة انتهاء الوقت
    function showTimeoutMessage() {
        // حذف أي إشعارات سابقة
        const existingAlerts = document.querySelectorAll('.timeout-alert');
        for (let alert of existingAlerts) {
            document.body.removeChild(alert);
        }
        
        // إنشاء إشعار جديد
        const timeoutEl = document.createElement('div');
        timeoutEl.className = 'timeout-alert';
        timeoutEl.textContent = '⏰ انتهى الوقت!';
        document.body.appendChild(timeoutEl);
        
        // إظهار الإشعار بتأثير مرئي
        setTimeout(() => {
            timeoutEl.classList.add('show');
        }, 10);
        
        // إظهار إشعار في منطقة حالة اللعبة أيضًا
        showStatus('انتهى الوقت! (+1 سترايك)', 'error');
        
        // إزالة الإشعار بعد 2 ثانية
        setTimeout(() => {
            timeoutEl.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(timeoutEl);
            }, 300);
        }, 2000);
    }
    
    // التحقق من انتهاء الجولة
    function checkRoundCompletion() {
        roomRef.child('gameState/roundCompleted').once('value', snapshot => {
            const isCompleted = snapshot.val();
            if (isCompleted) {
                // الانتقال إلى صفحة النتائج
                window.location.href = 'results.html?room=' + roomCode;
            }
        });
    }
    
    // إظهار رسالة الحالة
    function showStatus(message, type = 'info') {
        gameStatus.innerHTML = message;
        gameStatus.className = `status-message ${type}`;
        gameStatus.classList.remove('hidden');
        
        // إخفاء الرسالة بعد 3 ثوانٍ
        setTimeout(() => {
            gameStatus.classList.add('hidden');
        }, 3000);
    }
    
    // معالجة تقديم الإجابة
    submitButton.addEventListener('click', function() {
        const answer = answerInput.value.trim();
        
        if (!answer) {
            showStatus('يرجى إدخال إجابة', 'error');
            return;
        }
        
        // إيقاف المؤقت
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // إيقاف المؤقت في Firebase
        timerRef.update({
            active: false,
            expired: false
        });
        
        // التحقق من الإجابة
        const questionData = gameQuestions[currentQuestion];
        if (!questionData) {
            showStatus('حدث خطأ في تحميل السؤال', 'error');
            return;
        }
        
        // تنظيف الإجابة للمقارنة
        const cleanAnswer = answer.toLowerCase();
        const correctAnswers = questionData.answers.map(a => a.toLowerCase());
        
        // التحقق من صحة الإجابة
        const isCorrect = correctAnswers.some(a => {
            const isMatch = cleanAnswer.includes(a) || a.includes(cleanAnswer);
            return isMatch;
        });
        
        if (isCorrect) {
            // التحقق مما إذا كانت الإجابة مستخدمة مسبقًا
            roomRef.child(`gameState/usedAnswers/${cleanAnswer}`).once('value', snapshot => {
                const isUsed = snapshot.exists() && snapshot.val() === true;
                
                if (isUsed) {
                    showStatus('هذه الإجابة مستخدمة بالفعل، جرب إجابة أخرى', 'error');
                    // إضافة سترايك لاستخدام إجابة مستخدمة
                    addStrike();
                    return;
                }
                
                showStatus('إجابة صحيحة! 🎉', 'success');
                
                // تعليم الإجابة كمستخدمة
                roomRef.child(`gameState/usedAnswers/${cleanAnswer}`).set(true);
                
                // التحقق من استخدام جميع الإجابات
                roomRef.child('gameState/usedAnswers').once('value', answersSnapshot => {
                    const usedAnswersCount = answersSnapshot.numChildren();
                    
                    if (usedAnswersCount >= correctAnswers.length) {
                        // تم استخدام جميع الإجابات، كلا اللاعبين يحصلان على نقطة
                        roomRef.transaction(data => {
                            if (data === null) return data;
                            
                            // إضافة نقطة لكلا اللاعبين
                            data.players.player1.score = (data.players.player1?.score || 0) + 1;
                            data.players.player2.score = (data.players.player2?.score || 0) + 1;
                            
                            // إعادة تعيين السترايكات
                            data.players.player1.strikes = 0;
                            data.players.player2.strikes = 0;
                            
                            // إعادة تعيين السكيب لكلا اللاعبين للسؤال القادم
                            if (!data.gameState.skipUsed) data.gameState.skipUsed = {};
                            if (!data.gameState.skipUsed.player1) data.gameState.skipUsed.player1 = {};
                            if (!data.gameState.skipUsed.player2) data.gameState.skipUsed.player2 = {};
                            
                            // الانتقال إلى السؤال التالي
                            data.gameState.currentQuestion = (data.gameState.currentQuestion + 1);
                            
                            // التحقق من انتهاء الأسئلة (5 أسئلة)
                            if (data.gameState.currentQuestion >= 5) {
                                // تعليم الجولة كمنتهية
                                data.gameState.roundCompleted = true;
                            }
                            
                            // إعادة تعيين الإجابات المستخدمة للسؤال الجديد
                            data.gameState.usedAnswers = {};
                            
                            // إعادة تعيين الدور
                            data.gameState.currentTurn = opponentId;
                            
                            return data;
                        }).then(() => {
                            // التحقق من انتهاء الجولة بعد إجراء التحديث
                            checkRoundCompletion();
                        });
                        
                        showStatus('تم استخدام جميع الإجابات! كلا اللاعبين يحصلان على نقطة', 'success');
                    } else {
                        // تغيير الدور فقط
                        roomRef.child('gameState/currentTurn').set(opponentId);
                    }
                });
            });
        } else {
            showStatus('إجابة خاطئة', 'error');
            
            // إضافة سترايك
            addStrike();
        }
    });
    
    // إضافة سترايك
    function addStrike() {
        roomRef.transaction(data => {
            if (data === null) return data;
            
            // التحقق من دور اللاعب الحالي
            const currentTurnPlayer = data.gameState.currentTurn;
            
            const strikes = (data.players[currentTurnPlayer]?.strikes || 0) + 1;
            console.log(`تحديث السترايك للاعب ${currentTurnPlayer}: ${strikes}`);
            
            // تحديث عدد السترايكات
            data.players[currentTurnPlayer].strikes = strikes;
            
            // إذا وصل عدد السترايكات إلى 3
            if (strikes >= 3) {
                // أضف نقطة للخصم
                const opponent = currentTurnPlayer === 'player1' ? 'player2' : 'player1';
                data.players[opponent].score = (data.players[opponent]?.score || 0) + 1;
                
                // أعد تعيين السترايكات
                data.players[currentTurnPlayer].strikes = 0;
                data.players[opponent].strikes = 0;
                
                // إعادة تعيين السكيب لكلا اللاعبين للسؤال القادم
                if (!data.gameState.skipUsed) data.gameState.skipUsed = {};
                if (!data.gameState.skipUsed.player1) data.gameState.skipUsed.player1 = {};
                if (!data.gameState.skipUsed.player2) data.gameState.skipUsed.player2 = {};
                
                // الانتقال إلى السؤال التالي
                data.gameState.currentQuestion = (data.gameState.currentQuestion + 1);
                
                // التحقق من انتهاء الأسئلة (5 أسئلة)
                if (data.gameState.currentQuestion >= 5) {
                    // تعليم الجولة كمنتهية
                    data.gameState.roundCompleted = true;
                }
                
                // إعادة تعيين الإجابات المستخدمة للسؤال الجديد
                data.gameState.usedAnswers = {};
            }
            
            // تغيير الدور
            const nextPlayer = currentTurnPlayer === 'player1' ? 'player2' : 'player1';
            data.gameState.currentTurn = nextPlayer;
            
            // إعادة تعيين المؤقت
            if (!data.gameState.timer) data.gameState.timer = {};
            data.gameState.timer.active = false;
            
            return data;
        }).then(() => {
            // التحقق من انتهاء الجولة بعد إجراء التحديث
            checkRoundCompletion();
        });
    }
    
    // معالجة سكيب السؤال
    skipButton.addEventListener('click', function() {
        // إيقاف المؤقت
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // إيقاف المؤقت في Firebase
        timerRef.update({
            active: false,
            expired: false
        });
        
        // تعليم السكيب كمستخدم للسؤال الحالي
        roomRef.transaction(data => {
            if (data === null) return data;
            
            // إنشاء الهيكل إذا لم يكن موجودًا
            if (!data.gameState.skipUsed) data.gameState.skipUsed = {};
            if (!data.gameState.skipUsed[playerId]) data.gameState.skipUsed[playerId] = {};
            
            // تعليم السكيب كمستخدم للسؤال الحالي
            data.gameState.skipUsed[playerId][data.gameState.currentQuestion] = true;
            
            // تغيير الدور
            data.gameState.currentTurn = opponentId;
            
            return data;
        });
        
        showStatus('تم استخدام السكيب', 'info');
    });
    
    // معالجة الضغط على Enter في حقل الإجابة
    answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !submitButton.disabled) {
            e.preventDefault();
            submitButton.click();
        }
    });
});
