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

// عرض رسالة الحالة
function showStatus(element, message, type = 'info') {
    element.innerHTML = `<div class="status-message ${type}">${message}</div>`;
}

// الحصول على معلمات URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// التأكد من وجود معلومات اللاعب
function checkPlayerInfo() {
    const roomCode = localStorage.getItem('roomCode');
    const playerId = localStorage.getItem('playerId');
    
    if (!roomCode || !playerId) {
        alert('معلومات اللاعب غير متوفرة. سيتم توجيهك إلى الصفحة الرئيسية.');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}