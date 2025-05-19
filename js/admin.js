// إدارة الأسئلة

document.addEventListener('DOMContentLoaded', function() {
    const addQuestionForm = document.getElementById('add-question-form');
    const questionsContainer = document.getElementById('questions-container');
    const adminStatus = document.getElementById('admin-status');
    
    // جلب الأسئلة الحالية
    loadQuestions();
    
    // إضافة سؤال جديد
    addQuestionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const questionText = document.getElementById('question-text').value.trim();
        const answersText = document.getElementById('question-answers').value.trim();
        
        if (!questionText || !answersText) {
            showStatus(adminStatus, 'يرجى ملء جميع الحقول', 'error');
            return;
        }
        
        // تحويل الإجابات إلى مصفوفة
        const answers = answersText.split(',').map(answer => answer.trim()).filter(answer => answer);
        
        if (answers.length === 0) {
            showStatus(adminStatus, 'يرجى إدخال إجابة واحدة على الأقل', 'error');
            return;
        }
        
        // إضافة السؤال إلى قاعدة البيانات
        const newQuestionRef = database.ref('questions').push();
        
        newQuestionRef.set({
            question: questionText,
            answers: answers
        }).then(() => {
            showStatus(adminStatus, 'تم إضافة السؤال بنجاح', 'success');
            
            // إعادة تعيين النموذج
            addQuestionForm.reset();
            
            // إعادة تحميل الأسئلة
            loadQuestions();
        }).catch(error => {
            console.error('خطأ في إضافة السؤال:', error);
            showStatus(adminStatus, 'حدث خطأ أثناء إضافة السؤال: ' + error.message, 'error');
        });
    });
    
    // جلب الأسئلة الحالية
    function loadQuestions() {
        database.ref('questions').once('value')
            .then(snapshot => {
                questionsContainer.innerHTML = '';
                
                if (!snapshot.exists()) {
                    questionsContainer.innerHTML = '<p>لا توجد أسئلة حتى الآن.</p>';
                    return;
                }
                
                const questions = snapshot.val();
                
                Object.entries(questions).forEach(([key, question]) => {
                    const questionEl = createQuestionElement(key, question);
                    questionsContainer.appendChild(questionEl);
                });
            })
            .catch(error => {
                console.error('خطأ في جلب الأسئلة:', error);
                questionsContainer.innerHTML = '<p>حدث خطأ أثناء جلب الأسئلة.</p>';
            });
    }
    
    // إنشاء عنصر سؤال
    function createQuestionElement(id, question) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.dataset.id = id;
        
        const questionText = document.createElement('p');
        questionText.innerHTML = `<strong>السؤال:</strong> ${question.question}`;
        
        const answersText = document.createElement('p');
        answersText.innerHTML = `<strong>الإجابات:</strong> ${question.answers.join('، ')}`;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'question-actions';
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn danger';
        deleteButton.textContent = 'حذف';
        deleteButton.addEventListener('click', function() {
            if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
                deleteQuestion(id);
            }
        });
        
        actionsDiv.appendChild(deleteButton);
        questionDiv.appendChild(questionText);
        questionDiv.appendChild(answersText);
        questionDiv.appendChild(actionsDiv);
        
        return questionDiv;
    }
    
    // حذف سؤال
    function deleteQuestion(id) {
        database.ref('questions/' + id).remove()
            .then