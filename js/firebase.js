// إعدادات Firebase ووظائف قاعدة البيانات

// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCdYrpdM_7UJ-5VWWoJ0usrQR7lsvqoFog",
    authDomain: "footballchallange.firebaseapp.com",
    databaseURL: "https://footballchallange-default-rtdb.firebaseio.com",
    projectId: "footballchallange",
    storageBucket: "footballchallange.firebasestorage.app",
    messagingSenderId: "717977440447",
    appId: "1:717977440447:web:cc60fe924b93869dca760a",
    measurementId: "G-WXRVK8N5EW"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// إنشاء رمز غرفة عشوائي
function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// إنشاء غرفة جديدة
function createRoom(playerName) {
    return new Promise((resolve, reject) => {
        try {
            const roomCode = generateRoomCode();
            const roomRef = database.ref('rooms/' + roomCode);
            
            roomRef.set({
                status: 'waiting',
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                players: {
                    player1: {
                        name: playerName,
                        score: 0,
                        ready: true
                    }
                },
                gameState: {
                    currentRound: 1,
                    currentQuestion: 1,
                    currentTurn: 'player1',
                    timeLeft: 30,
                    roundStarted: false
                }
            }).then(() => {
                console.log('تم إنشاء الغرفة بنجاح:', roomCode);
                resolve(roomCode);
            }).catch(error => {
                console.error('خطأ في إنشاء الغرفة:', error);
                reject(error);
            });
        } catch (error) {
            console.error('خطأ غير متوقع:', error);
            reject(error);
        }
    });
}

// الانضمام إلى غرفة
function joinRoom(roomCode, playerName) {
    return new Promise((resolve, reject) => {
        try {
            if (!roomCode) {
                reject(new Error('رمز الغرفة مطلوب'));
                return;
            }
            
            const roomRef = database.ref('rooms/' + roomCode);
            
            roomRef.once('value')
                .then(snapshot => {
                    if (!snapshot.exists()) {
                        throw new Error('الغرفة غير موجودة');
                    }
                    
                    const roomData = snapshot.val();
                    console.log('بيانات الغرفة:', roomData);
                    
                    if (roomData.status !== 'waiting') {
                        throw new Error('اللعبة قد بدأت بالفعل');
                    }
                    
                    if (roomData.players && roomData.players.player2) {
                        throw new Error('الغرفة ممتلئة');
                    }
                    
                    // إضافة اللاعب الثاني
                    return roomRef.child('players').update({
                        player2: {
                            name: playerName,
                            score: 0,
                            ready: true
                        }
                    });
                })
                .then(() => {
                    // تحديث حالة الغرفة
                    return roomRef.update({
                        status: 'ready'
                    });
                })
                .then(() => {
                    console.log('تم الانضمام إلى الغرفة بنجاح');
                    resolve(roomCode);
                })
                .catch(error => {
                    console.error('خطأ في الانضمام إلى الغرفة:', error);
                    reject(error);
                });
        } catch (error) {
            console.error('خطأ غير متوقع:', error);
            reject(error);
        }
    });
}

// الاستماع للتغييرات في الغرفة
function listenToRoomChanges(roomCode, handlers) {
    const roomRef = database.ref('rooms/' + roomCode);
    
    const onValueChange = roomRef.on('value', snapshot => {
        if (!snapshot.exists()) {
            console.log('الغرفة غير موجودة');
            if (handlers && handlers.onRoomDeleted) {
                handlers.onRoomDeleted();
            }
            return;
        }
        
        const roomData = snapshot.val();
        if (handlers && handlers.onRoomUpdate) {
            handlers.onRoomUpdate(roomData);
        }
    });
    
    return {
        roomRef,
        onValueChange,
        unsubscribe: () => roomRef.off('value', onValueChange)
    };
}

// تحديث نتيجة اللاعب
function updatePlayerScore(roomCode, playerId, points) {
    if (!roomCode || !playerId) return Promise.reject(new Error('بيانات غير كاملة'));
    
    const playerRef = database.ref(`rooms/${roomCode}/players/${playerId}`);
    
    return playerRef.once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                throw new Error('اللاعب غير موجود');
            }
            
            const currentScore = snapshot.val().score || 0;
            return playerRef.update({
                score: currentScore + points
            });
        });
}

// تحديث دور اللاعب
function updateGameTurn(roomCode, nextPlayer) {
    if (!roomCode || !nextPlayer) return Promise.reject(new Error('بيانات غير كاملة'));
    
    return database.ref(`rooms/${roomCode}/gameState`).update({
        currentTurn: nextPlayer
    });
}

// الانتقال إلى السؤال التالي
function moveToNextQuestion(roomCode) {
    if (!roomCode) return Promise.reject(new Error('رمز الغرفة مطلوب'));
    
    const gameStateRef = database.ref(`rooms/${roomCode}/gameState`);
    
    return gameStateRef.once('value')
        .then(snapshot => {
            const currentData = snapshot.val();
            if (!currentData) {
                throw new Error('بيانات اللعبة غير موجودة');
            }
            
            let nextQuestion = (currentData.currentQuestion || 0) + 1;
            let currentRound = currentData.currentRound || 1;
            
            // التحقق من انتهاء أسئلة الجولة
            if (nextQuestion > 5) {
                nextQuestion = 1;
                currentRound += 1;
            }
            
            return gameStateRef.update({
                currentQuestion: nextQuestion,
                currentRound: currentRound
            });
        });
}

// إنهاء اللعبة
function endGame(roomCode) {
    if (!roomCode) return Promise.reject(new Error('رمز الغرفة مطلوب'));
    
    return database.ref(`rooms/${roomCode}`).update({
        status: 'completed'
    });
}

// حذف الغرفة
function deleteRoom(roomCode) {
    if (!roomCode) return Promise.reject(new Error('رمز الغرفة مطلوب'));
    
    return database.ref(`rooms/${roomCode}`).remove();
}