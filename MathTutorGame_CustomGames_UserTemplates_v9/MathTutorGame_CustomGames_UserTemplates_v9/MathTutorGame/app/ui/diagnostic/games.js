// 📁 game.js - النظام التعليمي الكامل للصف الرابع

// ==================== النظام الرئيسي ====================
const MathAdventureGame = {
    // ============= حالة اللعبة =============
    state: {
        // معلومات الطالب
        student: {
            id: null,
            name: '',
            age: 10,
            school: '',
            grade: 4,
            avatar: '👦'
        },

        // حالة التقييم
        assessment: {
            active: false,
            questions: [],
            currentQuestionIndex: 0,
            userAnswers: {},
            startTime: null,
            timer: 120, // 2 دقيقة لكل سؤال
            score: 0,
            correctAnswers: 0,
            totalQuestions: 15,
            completed: false
        },

        // حالة التعلم
        learning: {
            active: false,
            currentTopic: null,
            currentLevel: 'easy',
            progress: {},
            achievements: [],
            dailyStreak: 0,
            totalPlayTime: 0
        },

        // الإحصائيات
        stats: {
            totalGames: 0,
            totalCorrect: 0,
            totalQuestions: 0,
            bestScore: 0,
            favoriteTopic: null
        },

        // الإعدادات
        settings: {
            sound: true,
            music: true,
            animations: true,
            difficulty: 'auto',
            language: 'ar'
        }
    },

    // ============= التهيئة =============
    init() {
        console.log('🚀 تهيئة عالم الرياضيات السحري للصف الرابع...');

        // تحميل البيانات المحفوظة
        this.loadGameData();

        // تهيئة عناصر DOM
        this.initDOM();

        // إعداد مستمعي الأحداث
        this.setupEventListeners();

        // تهيئة الأنيميشنات
        this.initAnimations();

        // تهيئة الأصوات
        this.initAudio();

        // بدء المؤثرات البصرية
        this.startVisualEffects();

        console.log('✅ اللعبة جاهزة للاستخدام!');
    },

    // ============= تحميل البيانات =============
    loadGameData() {
        // تحميل بيانات الطالب
        const savedStudent = localStorage.getItem('math_adventure_student');
        if (savedStudent) {
            this.state.student = JSON.parse(savedStudent);
        }

        // تحميل الإحصائيات
        const savedStats = localStorage.getItem('math_adventure_stats');
        if (savedStats) {
            this.state.stats = JSON.parse(savedStats);
        }

        // تحميل الإعدادات
        const savedSettings = localStorage.getItem('math_adventure_settings');
        if (savedSettings) {
            this.state.settings = JSON.parse(savedSettings);
        }

        // تحميل تقدم التعلم
        const savedProgress = localStorage.getItem('math_adventure_progress');
        if (savedProgress) {
            this.state.learning.progress = JSON.parse(savedProgress);
        }
    },

    // ============= حفظ البيانات =============
    saveGameData() {
        localStorage.setItem('math_adventure_student', JSON.stringify(this.state.student));
        localStorage.setItem('math_adventure_stats', JSON.stringify(this.state.stats));
        localStorage.setItem('math_adventure_settings', JSON.stringify(this.state.settings));
        localStorage.setItem('math_adventure_progress', JSON.stringify(this.state.learning.progress));
    },

    // ============= تهيئة DOM =============
    initDOM() {
        // عناصر الشاشات
        this.screens = {
            start: document.getElementById('start-screen'),
            assessment: document.getElementById('assessment-screen'),
            results: document.getElementById('results-screen'),
            game: document.getElementById('game-screen')
        };

        // أزرار التنقل
        this.buttons = {
            startGame: document.getElementById('start-game'),
            backToStart: document.getElementById('back-to-start'),
            backToStart1: document.getElementById('back-to-start1'),
            startLearning: document.getElementById('start-learning'),
            reviewAnswers: document.getElementById('review-answers'),
            shareResults: document.getElementById('share-results'),
            newTest: document.getElementById('new-test'),
            prevQuestion: document.getElementById('prev-question'),
            nextQuestion: document.getElementById('next-question'),
            finishAssessment: document.getElementById('finish-assessment'),
            submitAnswer: document.getElementById('submit-answer')
        };

        // عناصر التقييم
        this.assessmentElements = {
            questionText: document.getElementById('question-text'),
            questionVisual: document.getElementById('question-visual'),
            answersGrid: document.getElementById('answers-grid'),
            numberPad: document.getElementById('number-pad'),
            dragDropArea: document.getElementById('drag-drop-area'),
            timerText: document.getElementById('timer-text'),
            timerFill: document.getElementById('timer-fill'),
            progressCircle: document.getElementById('progress-circle'),
            progressPercent: document.getElementById('progress-percent'),
            currentQuestion: document.getElementById('current-question'),
            correctCount: document.getElementById('correct-count'),
            topicTag: document.querySelector('#topic-tag span'),
            difficultyBadge: document.querySelector('#difficulty-badge span')
        };

        // عناصر النتائج
        this.resultsElements = {
            resultTitle: document.getElementById('result-main-title'),
            resultSubtitle: document.getElementById('result-subtitle'),
            levelTitle: document.getElementById('level-title'),
            levelProgressFill: document.getElementById('level-progress-fill'),
            levelPercentage: document.getElementById('level-percentage'),
            totalScore: document.getElementById('total-score'),
            percentageScore: document.getElementById('percentage-score'),
            timeUsed: document.getElementById('time-used'),
            topicsGrid: document.getElementById('topics-grid'),
            strengthsList: document.getElementById('strengths-list'),
            weaknessesList: document.getElementById('weaknesses-list'),
            recommendationsList: document.getElementById('recommendations-list'),
            planTimeline: document.getElementById('plan-timeline'),
            certificateName: document.getElementById('certificate-name'),
            certificateDate: document.getElementById('certificate-date')
        };

        // عناصر النماذج
        this.forms = {
            studentName: document.getElementById('student-name'),
            studentAge: document.getElementById('student-age'),
            studentClass: document.getElementById('student-class')
        };

        // عناصر الصوت
        this.audio = {
            correct: document.getElementById('correct-sound'),
            wrong: document.getElementById('wrong-sound'),
            win: document.getElementById('win-sound'),
            click: document.getElementById('click-sound'),
            levelUp: document.getElementById('level-up-sound')
        };
    },

    // ============= إعداد مستمعي الأحداث =============
    setupEventListeners() {
        // ===== شاشة البداية =====

        // زر بدء اللعبة
        this.buttons.startGame.addEventListener('click', () => {
            this.startAssessment();
        });

        // أزرار اختيار الوضع
        document.querySelectorAll('.mode-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.selectGameMode(mode);
            });
        });

        // تحديث بيانات الطالب
        this.forms.studentName.addEventListener('input', (e) => {
            this.state.student.name = e.target.value;
            this.saveGameData();
        });

        this.forms.studentAge.addEventListener('change', (e) => {
            this.state.student.age = e.target.value;
            this.saveGameData();
        });

        this.forms.studentClass.addEventListener('input', (e) => {
            this.state.student.school = e.target.value;
            this.saveGameData();
        });

        // تفاعل البطاقات
        document.querySelectorAll('.subject-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const subject = e.currentTarget.dataset.subject;
                this.showSubjectPreview(subject);
            });
        });

        // ===== شاشة التقييم =====

        // أزرار التنقل
        this.buttons.prevQuestion.addEventListener('click', () => {
            this.prevQuestion();
        });

        this.buttons.nextQuestion.addEventListener('click', () => {
            this.nextQuestion();
        });

        this.buttons.finishAssessment.addEventListener('click', () => {
            this.finishAssessment();
        });

        // زر العودة
        this.buttons.backToStart.addEventListener('click', () => {
            this.showScreen('start');
        });
        this.buttons.backToStart1.addEventListener('click', () => {
            this.showScreen('start');
        });

        // ===== شاشة النتائج =====

        this.buttons.startLearning.addEventListener('click', () => {
            this.startLearningMode();
        });

        this.buttons.reviewAnswers.addEventListener('click', () => {
            this.reviewAnswers();
        });

        this.buttons.shareResults.addEventListener('click', () => {
            this.shareResults();
        });

        this.buttons.newTest.addEventListener('click', () => {
            this.newAssessment();
        });

        // ===== تفاعلات إضافية =====

        // إظهار التلميح
        document.getElementById('show-hint')?.addEventListener('click', () => {
            this.showHint();
        });

        // أزرار لوحة الأرقام
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.id === 'clear-btn') {
                    this.clearTypedAnswer();
                } else if (e.target.id === 'submit-answer') {
                    this.submitTypedAnswer();
                } else {
                    this.addToTypedAnswer(e.target.dataset.number);
                }
            });
        });

        // النقر خارج الرسائل المنبثقة
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('message-popup')) {
                this.hideMessage();
            }
        });

        // مفاتيح الكيبورد
        document.addEventListener('keydown', (e) => {
            if (this.state.assessment.active) {
                this.handleKeyboardInput(e);
            }
        });
    },

    // ============= إدارة الشاشات =============
    showScreen(screenName) {
        // إخفاء جميع الشاشات
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });

        // إظهار الشاشة المطلوبة
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }

        // تشغيل صوت النقر
        this.playSound('click');
    },

    // ============= اختيار وضع اللعبة =============
    selectGameMode(mode) {
        this.playSound('click');

        const messages = {
            assessment: {
                title: '📝 اختبار تحديد المستوى',
                message: 'سنقيم مستواك ونضع خطة تعليمية مخصصة لك'
            },
            practice: {
                title: '💪 وضع التدريب',
                message: 'اختر الموضوع الذي تريد التدرب عليه'
            },
            challenge: {
                title: '🏆 وضع التحدي',
                message: 'تحدى نفسك في مسابقة ضد الزمن!'
            }
        };

        if (messages[mode]) {
            this.showMessage(messages[mode].title, messages[mode].message);
        }

        setTimeout(() => {
            if (mode === 'assessment') {
                this.startAssessment();
            } else if (mode === 'practice') {
                // سيتم تطويره لاحقاً
                this.showMessage('قريباً', 'وضع التدريب قيد التطوير!');
            } else if (mode === 'challenge') {
                // سيتم تطويره لاحقاً
                this.showMessage('قريباً', 'وضع التحدي قيد التطوير!');
            }
        }, 1500);
    },

    // ============= نظام التقييم =============
    startAssessment() {
        console.log('🎯 بدء اختبار التقييم...');

        // إعادة تعيين حالة التقييم
        this.state.assessment = {
            active: true,
            questions: this.generateAssessmentQuestions(),
            currentQuestionIndex: 0,
            userAnswers: {},
            startTime: Date.now(),
            timer: 120,
            score: 0,
            correctAnswers: 0,
            totalQuestions: 15,
            completed: false
        };

        // تحديث الإحصائيات
        this.state.stats.totalGames++;

        // الانتقال لشاشة التقييم
        this.showScreen('assessment');

        // تحميل السؤال الأول
        this.loadQuestion(0);

        // بدء المؤقت
        this.startTimer();

        // حفظ البيانات
        this.saveGameData();
    },

    // توليد أسئلة التقييم
    generateAssessmentQuestions() {
        const questions = [];
        const topics = Object.keys(Grade4Questions);

        // التأكد من وجود 15 سؤال
        let questionCount = 0;

        while (questionCount < 15) {
            for (const topic of topics) {
                if (questionCount >= 15) break;

                // اختيار مستوى عشوائي
                const difficulties = ['easy', 'medium', 'hard'];
                const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

                if (Grade4Questions[topic][randomDifficulty] &&
                    Grade4Questions[topic][randomDifficulty].length > 0) {

                    // اختيار سؤال عشوائي من هذا المستوى
                    const topicQuestions = Grade4Questions[topic][randomDifficulty];
                    const randomQuestion = topicQuestions[Math.floor(Math.random() * topicQuestions.length)];

                    // إضافة السؤال
                    questions.push({
                        ...randomQuestion,
                        topic: topic,
                        difficulty: randomDifficulty,
                        questionType: this.getRandomQuestionType()
                    });

                    questionCount++;
                }
            }
        }

        // خلط الأسئلة
        return this.shuffleArray(questions);
    },

    // الحصول على نوع سؤال عشوائي
    getRandomQuestionType() {
        const types = ['multiple-choice', 'typing', 'drag-drop'];
        return types[Math.floor(Math.random() * types.length)];
    },

    // تحميل السؤال
    loadQuestion(index) {
        if (!this.state.assessment.questions[index]) return;

        const question = this.state.assessment.questions[index];
        this.state.assessment.currentQuestionIndex = index;

        // تحديث نص السؤال
        this.assessmentElements.questionText.textContent = question.question;

        // تحديث المعلومات
        this.updateQuestionInfo(question);

        // إعداد نوع الإجابة
        this.setupAnswerType(question);

        // تحديث تقدم السؤال
        this.updateProgress();

        // إخفاء التلميح
        this.hideHint();

        // إعادة تعيين المؤقت
        this.state.assessment.timer = 120;
        this.updateTimerDisplay();
    },

    // تحديث معلومات السؤال
    updateQuestionInfo(question) {
        // تحديث اسم الموضوع
        const topicNames = {
            largeNumbers: 'الأعداد الكبيرة',
            additionSubtraction: 'الجمع والطرح',
            multiplicationDivision: 'الضرب والقسمة',
            fractions: 'الكسور',
            geometry: 'الهندسة',
            measurement: 'القياس',
            wordProblems: 'المسائل الكلامية'
        };

        if (this.assessmentElements.topicTag) {
            this.assessmentElements.topicTag.textContent = topicNames[question.topic] || question.topic;
        }

        // تحديث مستوى الصعوبة
        const difficultyNames = {
            easy: 'سهل',
            medium: 'متوسط',
            hard: 'صعب'
        };

        if (this.assessmentElements.difficultyBadge) {
            this.assessmentElements.difficultyBadge.textContent = difficultyNames[question.difficulty];
        }
    },

    // إعداد نوع الإجابة
    setupAnswerType(question) {
        // إخفاء كل المناطق أولاً
        this.hideAllAnswerAreas();

        // تحديد نوع السؤال
        const questionType = question.questionType || 'multiple-choice';

        switch (questionType) {
            case 'typing':
                this.setupTypingAnswer(question);
                break;
            case 'drag-drop':
                this.setupDragDropAnswer(question);
                break;
            default:
                this.setupMultipleChoiceAnswer(question);
        }

        // تحديث نوع اللعبة
        this.updateGameTypeIndicator(questionType);
    },

    // إخفاء جميع مناطق الإجابة
    hideAllAnswerAreas() {
        if (this.assessmentElements.answersGrid) {
            this.assessmentElements.answersGrid.style.display = 'none';
        }
        if (this.assessmentElements.numberPad) {
            this.assessmentElements.numberPad.style.display = 'none';
        }
        if (this.assessmentElements.dragDropArea) {
            this.assessmentElements.dragDropArea.style.display = 'none';
        }
    },

    // إعداد إجابة متعددة الخيارات
    setupMultipleChoiceAnswer(question) {
        if (!this.assessmentElements.answersGrid) return;

        this.assessmentElements.answersGrid.style.display = 'grid';
        this.assessmentElements.answersGrid.innerHTML = '';

        // إضافة أزرار الخيارات
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'answer-button';
            button.textContent = option;
            button.dataset.index = index;

            button.addEventListener('click', () => {
                this.handleAnswer(index);
            });

            this.assessmentElements.answersGrid.appendChild(button);
        });
    },

    // إعداد إجابة الكتابة
    setupTypingAnswer(question) {
        if (!this.assessmentElements.numberPad) return;

        this.assessmentElements.numberPad.style.display = 'block';
        this.currentTypedAnswer = '0';

        // تحديث العرض
        const numberDisplay = document.querySelector('.number-display');
        if (numberDisplay) {
            numberDisplay.textContent = this.currentTypedAnswer;
        }
    },

    // إعداد إجابة السحب والإفلات
    setupDragDropAnswer(question) {
        if (!this.assessmentElements.dragDropArea) return;

        this.assessmentElements.dragDropArea.style.display = 'flex';

        // إعداد العناصر القابلة للسحب
        const dragItems = document.getElementById('drag-items');
        if (dragItems) {
            dragItems.innerHTML = '';

            question.options.forEach((option, index) => {
                const item = document.createElement('div');
                item.className = 'drag-item';
                item.textContent = option;
                item.dataset.index = index;
                item.draggable = true;

                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', index);
                    item.classList.add('dragging');
                });

                item.addEventListener('dragend', () => {
                    item.classList.remove('dragging');
                });

                dragItems.appendChild(item);
            });
        }

        // إعداد منطقة الإفلات
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.innerHTML = `
                <div class="drop-placeholder">
                    <i class="fas fa-hand-point-up"></i>
                    <p>اسحب الإجابة الصحيحة إلى هنا</p>
                </div>
            `;

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('active');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('active');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                const index = e.dataTransfer.getData('text/plain');

                // عرض الإجابة المختارة
                dropZone.innerHTML = `<div class="drag-item">${question.options[index]}</div>`;
                dropZone.classList.remove('active');

                // تسجيل الإجابة بعد تأخير قصير
                setTimeout(() => {
                    this.handleAnswer(parseInt(index));
                }, 500);
            });
        }
    },

    // تحديث مؤشر نوع اللعبة
    updateGameTypeIndicator(type) {
        const indicator = document.querySelector('.game-type-text');
        const icon = document.querySelector('.game-type-icon i');

        if (!indicator || !icon) return;

        const typeConfig = {
            'multiple-choice': { text: 'اختر الإجابة الصحيحة', icon: 'fa-mouse-pointer' },
            'typing': { text: 'اكتب الإجابة', icon: 'fa-keyboard' },
            'drag-drop': { text: 'اسحب وأفلت', icon: 'fa-hand-rock' }
        };

        const config = typeConfig[type] || typeConfig['multiple-choice'];
        indicator.textContent = config.text;
        icon.className = `fas ${config.icon}`;
    },

    // ============= معالجة الإجابات =============
    handleAnswer(answer) {
        const currentIndex = this.state.assessment.currentQuestionIndex;
        const question = this.state.assessment.questions[currentIndex];

        if (!question) return;

        // تسجيل الإجابة
        this.state.assessment.userAnswers[currentIndex] = answer;

        // التحقق من صحة الإجابة
        const isCorrect = this.checkAnswer(question, answer);

        // تحديث النتائج
        if (isCorrect) {
            this.state.assessment.correctAnswers++;
            this.state.assessment.score += this.getQuestionScore(question.difficulty);
            this.playSound('correct');
            this.showMessage('🎉 إجابة صحيحة!', `+${this.getQuestionScore(question.difficulty)} نقطة`);
        } else {
            this.playSound('wrong');
            this.showMessage('❌ إجابة خاطئة', `الإجابة الصحيحة: ${this.getCorrectAnswerText(question)}`);
        }

        // تحديث الإحصائيات
        this.state.stats.totalQuestions++;
        if (isCorrect) {
            this.state.stats.totalCorrect++;
        }

        // الانتقال للسؤال التالي
        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    },

    // إضافة رقم للإجابة المكتوبة
    addToTypedAnswer(number) {
        if (this.currentTypedAnswer === '0') {
            this.currentTypedAnswer = number;
        } else if (this.currentTypedAnswer.length < 6) {
            this.currentTypedAnswer += number;
        }

        const numberDisplay = document.querySelector('.number-display');
        if (numberDisplay) {
            numberDisplay.textContent = this.currentTypedAnswer;
        }

        this.playSound('click');
    },

    // مسح الإجابة المكتوبة
    clearTypedAnswer() {
        this.currentTypedAnswer = '0';
        const numberDisplay = document.querySelector('.number-display');
        if (numberDisplay) {
            numberDisplay.textContent = this.currentTypedAnswer;
        }
        this.playSound('click');
    },

    // إرسال الإجابة المكتوبة
    submitTypedAnswer() {
        const answer = parseInt(this.currentTypedAnswer);
        this.handleAnswer(answer);
    },

    // التحقق من صحة الإجابة
    checkAnswer(question, userAnswer) {
        // معالجة أنواع الأسئلة المختلفة
        if (question.questionType === 'typing') {
            return parseInt(userAnswer) === question.correct;
        } else {
            return parseInt(userAnswer) === question.correct;
        }
    },

    // الحصول على نص الإجابة الصحيحة
    getCorrectAnswerText(question) {
        if (question.questionType === 'typing') {
            return question.correct.toString();
        } else {
            return question.options[question.correct];
        }
    },

    // حساب نقاط السؤال
    getQuestionScore(difficulty) {
        const scores = {
            easy: 50,
            medium: 75,
            hard: 100
        };
        return scores[difficulty] || 50;
    },

    // ============= التنقل بين الأسئلة =============
    prevQuestion() {
        const currentIndex = this.state.assessment.currentQuestionIndex;
        if (currentIndex > 0) {
            this.loadQuestion(currentIndex - 1);
            this.playSound('click');
        }
    },

    nextQuestion() {
        const currentIndex = this.state.assessment.currentQuestionIndex;
        const totalQuestions = this.state.assessment.questions.length;

        if (currentIndex < totalQuestions - 1) {
            this.loadQuestion(currentIndex + 1);
            this.playSound('click');
        } else {
            this.finishAssessment();
        }
    },

    // ============= المؤقت =============
    startTimer() {
        clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            if (this.state.assessment.timer > 0) {
                this.state.assessment.timer--;
                this.updateTimerDisplay();
            } else {
                clearInterval(this.timerInterval);
                this.handleTimeUp();
            }
        }, 1000);
    },

    updateTimerDisplay() {
        if (!this.assessmentElements.timerText) return;

        const minutes = Math.floor(this.state.assessment.timer / 60);
        const seconds = this.state.assessment.timer % 60;

        this.assessmentElements.timerText.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // تحديث شريط التقدم
        if (this.assessmentElements.timerFill) {
            const percent = (this.state.assessment.timer / 120) * 100;
            this.assessmentElements.timerFill.style.width = `${percent}%`;

            // تغيير اللون عند اقتراب النهاية
            if (this.state.assessment.timer <= 10) {
                this.assessmentElements.timerFill.style.background = 'var(--grade4-danger)';
                this.assessmentElements.timerText.style.color = 'var(--grade4-danger)';
            } else if (this.state.assessment.timer <= 30) {
                this.assessmentElements.timerFill.style.background = 'var(--grade4-warning)';
                this.assessmentElements.timerText.style.color = 'var(--grade4-warning)';
            } else {
                this.assessmentElements.timerFill.style.background = 'var(--grade4-primary)';
                this.assessmentElements.timerText.style.color = 'white';
            }
        }
    },

    handleTimeUp() {
        const currentIndex = this.state.assessment.currentQuestionIndex;
        const question = this.state.assessment.questions[currentIndex];

        if (question && !this.state.assessment.userAnswers[currentIndex]) {
            // تسجيل إجابة خاطئة إذا لم يتم الإجابة
            this.state.assessment.userAnswers[currentIndex] = -1;
            this.showMessage('⏰ انتهى الوقت!', 'لم تتم الإجابة في الوقت المحدد');

            setTimeout(() => {
                this.nextQuestion();
            }, 1500);
        }
    },

    // ============= تحديث التقدم =============
    updateProgress() {
        const currentIndex = this.state.assessment.currentQuestionIndex + 1;
        const totalQuestions = this.state.assessment.questions.length;

        // تحديث مؤشر السؤال الحالي
        if (this.assessmentElements.currentQuestion) {
            this.assessmentElements.currentQuestion.textContent = currentIndex;
        }

        // تحديث عدد الإجابات الصحيحة
        if (this.assessmentElements.correctCount) {
            this.assessmentElements.correctCount.textContent = this.state.assessment.correctAnswers;
        }

        // تحديث النسبة المئوية
        const progressPercent = (currentIndex / totalQuestions) * 100;
        if (this.assessmentElements.progressPercent) {
            this.assessmentElements.progressPercent.textContent = `${Math.round(progressPercent)}%`;
        }

        // تحديث دائرة التقدم
        if (this.assessmentElements.progressCircle) {
            const circumference = 2 * Math.PI * 40; // نصف القطر 40
            const offset = circumference - (progressPercent / 100) * circumference;
            this.assessmentElements.progressCircle.style.strokeDashoffset = offset;
        }
    },

    // ============= إنهاء التقييم =============
    finishAssessment() {
        console.log('🏁 إنهاء الاختبار...');

        clearInterval(this.timerInterval);

        // تحديث حالة التقييم
        this.state.assessment.active = false;
        this.state.assessment.completed = true;
        this.state.assessment.endTime = Date.now();

        // حساب النتائج
        const results = this.calculateResults();

        // حفظ النتائج
        this.assessmentResults = results;

        // تحديث أفضل نتيجة
        if (this.state.assessment.score > this.state.stats.bestScore) {
            this.state.stats.bestScore = this.state.assessment.score;
            this.playSound('levelUp');
        }

        // حفظ البيانات
        this.saveGameData();

        // عرض النتائج
        this.showResults();

        // تشغيل صوت النجاح
        this.playSound('win');
    },

    // حساب النتائج
    calculateResults() {
        const { assessment } = this.state;

        // حساب النسبة المئوية
        const percentage = (assessment.correctAnswers / assessment.totalQuestions) * 100;

        // تحديد المستوى
        let level, levelColor;
        if (percentage >= 90) {
            level = 'متميز';
            levelColor = '#4D96FF';
        } else if (percentage >= 70) {
            level = 'متقدم';
            levelColor = '#6BCF7F';
        } else if (percentage >= 50) {
            level = 'متوسط';
            levelColor = '#FFD93D';
        } else {
            level = 'مبتدئ';
            levelColor = '#FF6B6B';
        }

        // تحليل الموضوعات
        const topicsAnalysis = this.analyzeTopics();

        // تحديد نقاط القوة والضعف
        const { strengths, weaknesses } = this.identifyStrengthsWeaknesses(topicsAnalysis);

        // توليد التوصيات
        const recommendations = this.generateRecommendations(level, weaknesses);

        // توليد الخطة الدراسية
        const studyPlan = this.generateStudyPlan(level, weaknesses);

        // حساب الوقت المستخدم
        const timeUsed = this.calculateTimeUsed();

        return {
            percentage,
            level,
            levelColor,
            score: assessment.score,
            correctAnswers: assessment.correctAnswers,
            totalQuestions: assessment.totalQuestions,
            timeUsed,
            topicsAnalysis,
            strengths,
            weaknesses,
            recommendations,
            studyPlan
        };
    },

    // تحليل الموضوعات
    analyzeTopics() {
        const analysis = {};
        const { assessment } = this.state;

        assessment.questions.forEach((question, index) => {
            const topic = question.topic;

            if (!analysis[topic]) {
                analysis[topic] = {
                    total: 0,
                    correct: 0,
                    score: 0
                };
            }

            analysis[topic].total++;

            if (assessment.userAnswers[index] === question.correct) {
                analysis[topic].correct++;
                analysis[topic].score += this.getQuestionScore(question.difficulty);
            }
        });

        // حساب النسب المئوية
        Object.keys(analysis).forEach(topic => {
            const data = analysis[topic];
            data.percentage = data.total > 0 ? (data.correct / data.total) * 100 : 0;
            data.strength = data.percentage >= 70;
            data.needsImprovement = data.percentage < 50;
        });

        return analysis;
    },

    // تحديد نقاط القوة والضعف
    identifyStrengthsWeaknesses(analysis) {
        const strengths = [];
        const weaknesses = [];

        Object.entries(analysis).forEach(([topic, data]) => {
            const topicName = this.getTopicName(topic);

            if (data.strength) {
                strengths.push(topicName);
            }

            if (data.needsImprovement) {
                weaknesses.push(topicName);
            }
        });

        return { strengths, weaknesses };
    },

    // توليد التوصيات
    generateRecommendations(level, weaknesses) {
        const recommendations = [];

        // توصيات حسب المستوى
        const levelRecommendations = {
            مبتدئ: [
                'ابدأ بمراجعة أساسيات الرياضيات',
                'تدرب على القراءة والكتابة للأعداد',
                'ركز على الجمع والطرح البسيط'
            ],
            متوسط: [
                'طور مهاراتك في الضرب والقسمة',
                'تعلم حل المسائل الكلامية البسيطة',
                'تدرب على الكسور الأساسية'
            ],
            متقدم: [
                'تعمق في الكسور والمقارنة',
                'تدرب على المسائل متعددة الخطوات',
                'طور مهاراتك في الهندسة'
            ],
            متميز: [
                'يمكنك التقدم لمواضيع أكثر تقدماً',
                'جرب تحديات إبداعية في الرياضيات',
                'ساعد الآخرين في فهم المفاهيم الصعبة'
            ]
        };

        if (levelRecommendations[level]) {
            recommendations.push(...levelRecommendations[level]);
        }

        // توصيات حسب نقاط الضعف
        weaknesses.forEach(weakness => {
            recommendations.push(`ركز على تحسين مهاراتك في: ${weakness}`);
        });

        // توصيات عامة
        recommendations.push('مارس الرياضيات يومياً لمدة 20 دقيقة');
        recommendations.push('استخدم التطبيقات التعليمية لتعزيز التعلم');
        recommendations.push('لا تتردد في طلب المساعدة عند الحاجة');

        return recommendations.slice(0, 5); // تحديد 5 توصيات فقط
    },

    // توليد الخطة الدراسية
    generateStudyPlan(level, weaknesses) {
        const plan = {
            duration: '4 أسابيع',
            dailyPractice: '20 دقيقة',
            weeklyGoals: []
        };

        if (level === 'مبتدئ') {
            plan.weeklyGoals = [
                'الأسبوع 1: مراجعة الأعداد حتى 1000 والجمع البسيط',
                'الأسبوع 2: تعلم الطرح والضرب الأساسي',
                'الأسبوع 3: مقدمة في الكسور والأشكال الهندسية',
                'الأسبوع 4: حل مسائل كلامية بسيطة ومراجعة شاملة'
            ];
        } else if (level === 'متوسط') {
            plan.weeklyGoals = [
                'الأسبوع 1: الأعداد الكبيرة والعمليات المتقدمة',
                'الأسبوع 2: الضرب والقسمة بمستويات مختلفة',
                'الأسبوع 3: الكسور المتكافئة والعمليات عليها',
                'الأسبوع 4: الهندسة العملية والقياس'
            ];
        } else {
            plan.weeklyGoals = [
                'الأسبوع 1: تحدي في المسائل المعقدة',
                'الأسبوع 2: تطبيقات عملية للرياضيات',
                'الأسبوع 3: التفكير الإبداعي في حل المشكلات',
                'الأسبوع 4: الإعداد للمستويات المتقدمة'
            ];
        }

        // إضافة أهداف خاصة بنقاط الضعف
        if (weaknesses.length > 0) {
            plan.specialFocus = `ركز بشكل خاص على: ${weaknesses.join(', ')}`;
        }

        return plan;
    },

    // حساب الوقت المستخدم
    calculateTimeUsed() {
        const { assessment } = this.state;
        if (!assessment.startTime || !assessment.endTime) return '--:--';

        const totalSeconds = Math.floor((assessment.endTime - assessment.startTime) / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    // ============= عرض النتائج =============
    showResults() {
        this.showScreen('results');
        this.updateResultsDisplay();
        this.createCelebration();
        this.updateCertificate();
    },

    updateResultsDisplay() {
        const results = this.assessmentResults;
        if (!results) return;

        // تحديث المعلومات الأساسية
        if (this.resultsElements.resultTitle) {
            this.resultsElements.resultTitle.textContent =
                results.percentage >= 70 ? '🎉 مبروك! 🎉' : '👏 أحسنت! 👏';
        }

        if (this.resultsElements.resultSubtitle) {
            this.resultsElements.resultSubtitle.textContent =
                `لقد أكملت الاختبار بنجاح`;
        }

        // تحديث المستوى
        if (this.resultsElements.levelTitle) {
            this.resultsElements.levelTitle.textContent = `المستوى: ${results.level}`;
        }

        if (this.resultsElements.levelProgressFill) {
            this.resultsElements.levelProgressFill.style.width = `${results.percentage}%`;
            this.resultsElements.levelProgressFill.style.background = results.levelColor;
        }

        if (this.resultsElements.levelPercentage) {
            this.resultsElements.levelPercentage.textContent = `${Math.round(results.percentage)}%`;
        }

        // تحديث الدرجات
        if (this.resultsElements.totalScore) {
            this.resultsElements.totalScore.textContent = results.score;
        }

        if (this.resultsElements.percentageScore) {
            this.resultsElements.percentageScore.textContent = `${Math.round(results.percentage)}%`;
        }

        if (this.resultsElements.timeUsed) {
            this.resultsElements.timeUsed.textContent = results.timeUsed;
        }

        // تحديث تحليل الموضوعات
        this.updateTopicsAnalysis(results.topicsAnalysis);

        // تحديث نقاط القوة والضعف
        this.updateStrengthsWeaknesses(results.strengths, results.weaknesses);

        // تحديث التوصيات
        this.updateRecommendations(results.recommendations);

        // تحديث الخطة الدراسية
        this.updateStudyPlan(results.studyPlan);
    },

    updateTopicsAnalysis(analysis) {
        if (!this.resultsElements.topicsGrid) return;

        this.resultsElements.topicsGrid.innerHTML = '';

        Object.entries(analysis).forEach(([topic, data]) => {
            const topicName = this.getTopicName(topic);
            const percentage = Math.round(data.percentage);

            const card = document.createElement('div');
            card.className = 'topic-card';
            card.innerHTML = `
                <div class="topic-header">
                    <div class="topic-icon">
                        ${this.getTopicIcon(topic)}
                    </div>
                    <h4>${topicName}</h4>
                    <div class="topic-score">${percentage}%</div>
                </div>
                <div class="topic-progress">
                    <div class="topic-bar">
                        <div class="topic-fill" style="width: ${percentage}%; 
                             background: ${percentage >= 70 ? 'var(--grade4-success)' :
                percentage >= 50 ? 'var(--grade4-warning)' :
                    'var(--grade4-danger)'}"></div>
                    </div>
                    <div class="topic-status">
                        <span>${data.correct}/${data.total}</span>
                        <span>${percentage}%</span>
                    </div>
                </div>
            `;

            this.resultsElements.topicsGrid.appendChild(card);
        });
    },

    updateStrengthsWeaknesses(strengths, weaknesses) {
        // نقاط القوة
        if (this.resultsElements.strengthsList) {
            this.resultsElements.strengthsList.innerHTML = '';

            if (strengths.length === 0) {
                this.resultsElements.strengthsList.innerHTML =
                    '<li class="strength-item"><i class="fas fa-info-circle"></i><span>لا توجد نقاط قوة واضحة بعد</span></li>';
            } else {
                strengths.forEach(strength => {
                    const li = document.createElement('li');
                    li.className = 'strength-item';
                    li.innerHTML = `<i class="fas fa-star"></i><span>${strength}</span>`;
                    this.resultsElements.strengthsList.appendChild(li);
                });
            }
        }

        // نقاط الضعف
        if (this.resultsElements.weaknessesList) {
            this.resultsElements.weaknessesList.innerHTML = '';

            if (weaknesses.length === 0) {
                this.resultsElements.weaknessesList.innerHTML =
                    '<li class="weakness-item"><i class="fas fa-check-circle"></i><span>أداء متوازن في جميع المجالات</span></li>';
            } else {
                weaknesses.forEach(weakness => {
                    const li = document.createElement('li');
                    li.className = 'weakness-item';
                    li.innerHTML = `<i class="fas fa-lightbulb"></i><span>${weakness}</span>`;
                    this.resultsElements.weaknessesList.appendChild(li);
                });
            }
        }
    },

    updateRecommendations(recommendations) {
        if (!this.resultsElements.recommendationsList) return;

        this.resultsElements.recommendationsList.innerHTML = '';

        recommendations.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'recommendation-card';
            card.innerHTML = `
                <div class="rec-icon">
                    <i class="fas fa-bullseye"></i>
                </div>
                <div class="rec-content">
                    <h4>${rec.split(':')[0]}</h4>
                    <p>${rec.split(':')[1] || rec}</p>
                </div>
            `;

            this.resultsElements.recommendationsList.appendChild(card);
        });
    },

    updateStudyPlan(studyPlan) {
        if (!this.resultsElements.planTimeline) return;

        this.resultsElements.planTimeline.innerHTML = '';

        studyPlan.weeklyGoals.forEach((goal, index) => {
            const weekNumber = index + 1;
            const parts = goal.split(': ');
            const weekTheme = parts[0];
            const weekTasks = parts[1] || '';

            const weekElement = document.createElement('div');
            weekElement.className = 'plan-week';
            weekElement.innerHTML = `
                <div class="week-header">
                    <div class="week-number">الأسبوع ${weekNumber}</div>
                    <div class="week-theme">${weekTheme}</div>
                </div>
                <div class="week-tasks">
                    ${weekTasks.split('،').map(task => `
                        <div class="task">
                            <i class="fas fa-check-circle"></i>
                            <span>${task.trim()}</span>
                        </div>
                    `).join('')}
                </div>
            `;

            this.resultsElements.planTimeline.appendChild(weekElement);
        });

        // إضافة التركيز الخاص
        if (studyPlan.specialFocus) {
            const focusElement = document.createElement('div');
            focusElement.className = 'special-focus';
            focusElement.innerHTML = `
                <h4><i class="fas fa-bullseye"></i> تركيز خاص</h4>
                <p>${studyPlan.specialFocus}</p>
            `;
            this.resultsElements.planTimeline.appendChild(focusElement);
        }
    },

    // ============= الشهادة =============
    updateCertificate() {
        if (!this.resultsElements.certificateName || !this.resultsElements.certificateDate) return;

        // تحديث اسم الطالب
        const studentName = this.state.student.name || 'الطالب المتميز';
        this.resultsElements.certificateName.textContent = studentName;

        // تحديث التاريخ
        const now = new Date();
        const dateString = now.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        this.resultsElements.certificateDate.textContent = dateString;
    },

    // ============= إنشاء الاحتفال =============
    createCelebration() {
        const container = document.getElementById('confetti-container');
        if (!container) return;

        container.innerHTML = '';

        const colors = ['#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0'];

        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.width = `${Math.random() * 20 + 5}px`;
            confetti.style.height = `${Math.random() * 20 + 5}px`;
            confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';

            container.appendChild(confetti);

            // إزالة الكونفيتي بعد الأنيميشن
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }
    },

    // ============= وظائف مساعدة =============

    // الحصول على اسم الموضوع
    getTopicName(topicId) {
        const topicMap = {
            largeNumbers: 'الأعداد الكبيرة',
            additionSubtraction: 'الجمع والطرح',
            multiplicationDivision: 'الضرب والقسمة',
            fractions: 'الكسور',
            geometry: 'الهندسة',
            measurement: 'القياس',
            wordProblems: 'المسائل الكلامية'
        };
        return topicMap[topicId] || topicId;
    },

    // الحصول على أيقونة الموضوع
    getTopicIcon(topicId) {
        const iconMap = {
            largeNumbers: '🔢',
            additionSubtraction: '➕➖',
            multiplicationDivision: '✖️➗',
            fractions: '½',
            geometry: '📐',
            measurement: '📏',
            wordProblems: '💭'
        };
        return iconMap[topicId] || '📚';
    },

    // عرض معاينة الموضوع
    showSubjectPreview(subject) {
        const subjectInfo = {
            numbers: { title: 'الأعداد الكبيرة', desc: 'تعلم قراءة وكتابة ومقارنة الأعداد الكبيرة' },
            operations: { title: 'العمليات الحسابية', desc: 'تدرب على الجمع والطرح والضرب والقسمة' },
            fractions: { title: 'الكسور', desc: 'افهم الكسور وكيفية التعامل معها' },
            geometry: { title: 'الهندسة', desc: 'تعرف على الأشكال الهندسية وخصائصها' },
            measurement: { title: 'القياس', desc: 'تعلم قياس الطول والوزن والزمن' },
            problems: { title: 'المسائل الكلامية', desc: 'طور مهاراتك في حل المسائل الرياضية' }
        };

        const info = subjectInfo[subject];
        if (info) {
            this.showMessage(info.title, info.desc);
        }
    },

    // عرض التلميح
    showHint() {
        const hintContent = document.getElementById('hint-content');
        if (hintContent) {
            hintContent.style.display = 'block';
            this.playSound('click');
        }
    },

    // إخفاء التلميح
    hideHint() {
        const hintContent = document.getElementById('hint-content');
        if (hintContent) {
            hintContent.style.display = 'none';
        }
    },

    // معالجة إدخال الكيبورد
    handleKeyboardInput(e) {
        const currentQuestion = this.state.assessment.questions[this.state.assessment.currentQuestionIndex];

        if (!currentQuestion) return;

        if (currentQuestion.questionType === 'typing') {
            if (e.key >= '0' && e.key <= '9') {
                this.addToTypedAnswer(e.key);
            } else if (e.key === 'Enter') {
                this.submitTypedAnswer();
            } else if (e.key === 'Backspace') {
                this.clearTypedAnswer();
            }
        } else if (currentQuestion.questionType === 'multiple-choice') {
            if (e.key >= '1' && e.key <= '4') {
                const index = parseInt(e.key) - 1;
                if (index < currentQuestion.options.length) {
                    this.handleAnswer(index);
                }
            }
        }
    },

    // ============= نظام التعلم =============
    startLearningMode() {
        this.showMessage('وضع التعلم', 'سيتم تفعيل وضع التعلم قريباً!');
        // يمكن تطويره لاحقاً
    },

    reviewAnswers() {
        this.showMessage('مراجعة الإجابات', 'سيتم تفعيل خاصية مراجعة الإجابات قريباً!');
        // يمكن تطويره لاحقاً
    },

    shareResults() {
        const results = this.assessmentResults;
        if (!results) return;

        const shareText = `
🎮 عالم الرياضيات السحري - الصف الرابع
🏆 نتيجة الاختبار: ${results.score} نقطة
📊 المستوى: ${results.level}
✅ الإجابات الصحيحة: ${results.correctAnswers}/${results.totalQuestions}
⏰ الوقت المستخدم: ${results.timeUsed}
${window.location.href}
        `.trim();

        if (navigator.share) {
            navigator.share({
                title: 'نتيجة اختبار الرياضيات',
                text: shareText,
                url: window.location.href
            }).catch(err => {
                console.log('خطأ في المشاركة:', err);
                this.copyToClipboard(shareText);
            });
        } else {
            this.copyToClipboard(shareText);
        }
    },

    copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => {
                this.showMessage('تم النسخ!', 'تم نسخ النتيجة إلى الحافظة');
            })
            .catch(err => {
                console.log('خطأ في النسخ:', err);
                this.showMessage('عذراً', 'تعذر نسخ النتيجة');
            });
    },

    newAssessment() {
        this.showMessage('اختبار جديد', 'سيتم بدء اختبار جديد');
        setTimeout(() => {
            this.startAssessment();
        }, 1500);
    },

    // ============= الصوت =============
    initAudio() {
        // تعطيل الصوت إذا كان غير مفعل في الإعدادات
        if (!this.state.settings.sound) {
            Object.values(this.audio).forEach(audio => {
                if (audio) audio.volume = 0;
            });
        }
    },

    playSound(type) {
        if (!this.state.settings.sound) return;

        const audio = this.audio[type];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('لا يمكن تشغيل الصوت:', e));
        }
    },

    // ============= الأنيميشنات =============
    initAnimations() {
        if (!this.state.settings.animations) return;

        // بدء المؤثرات البصرية
        this.startVisualEffects();

        // إضافة أنيميشنات للعناصر
        this.addElementAnimations();
    },

    startVisualEffects() {
        // إنشاء أرقام عائمة
        this.createFloatingNumbers();

        // إنشاء أشكال عائمة
        this.createFloatingShapes();

        // تأثير تتبع الماوس
        this.setupMouseTrail();
    },

    createFloatingNumbers() {
        const container = document.getElementById('floating-numbers');
        if (!container) return;

        const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

        for (let i = 0; i < 20; i++) {
            const number = document.createElement('div');
            number.className = 'floating-element';
            number.textContent = numbers[Math.floor(Math.random() * numbers.length)];
            number.style.left = `${Math.random() * 100}vw`;
            number.style.fontSize = `${Math.random() * 2 + 1}rem`;
            number.style.animationDuration = `${Math.random() * 10 + 10}s`;
            number.style.animationDelay = `${Math.random() * 5}s`;

            container.appendChild(number);
        }
    },

    createFloatingShapes() {
        const container = document.getElementById('floating-shapes');
        if (!container) return;

        const shapes = ['🔺', '🔵', '◼️', '⭐', '🔶', '🟣', '🔷'];

        for (let i = 0; i < 15; i++) {
            const shape = document.createElement('div');
            shape.className = 'floating-element';
            shape.textContent = shapes[Math.floor(Math.random() * shapes.length)];
            shape.style.left = `${Math.random() * 100}vw`;
            shape.style.fontSize = `${Math.random() * 1.5 + 0.5}rem`;
            shape.style.animationDuration = `${Math.random() * 15 + 15}s`;
            shape.style.animationDelay = `${Math.random() * 3}s`;

            container.appendChild(shape);
        }
    },

    setupMouseTrail() {
        const container = document.getElementById('mouse-trail');
        if (!container) return;

        document.addEventListener('mousemove', (e) => {
            // إنشاء أثر الماوس
            const trail = document.createElement('div');
            trail.style.position = 'fixed';
            trail.style.width = '20px';
            trail.style.height = '20px';
            trail.style.background = 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)';
            trail.style.borderRadius = '50%';
            trail.style.pointerEvents = 'none';
            trail.style.left = `${e.clientX - 10}px`;
            trail.style.top = `${e.clientY - 10}px`;
            trail.style.zIndex = '999';

            container.appendChild(trail);

            // إزالة الأثر بعد فترة
            setTimeout(() => {
                if (trail.parentNode) {
                    trail.parentNode.removeChild(trail);
                }
            }, 1000);
        });
    },

    addElementAnimations() {
        // إضافة أنيميشنات لأزرار الإجابة
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('.answer-button').forEach(btn => {
                btn.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.05) rotate(2deg)';
                });

                btn.addEventListener('mouseleave', function() {
                    this.style.transform = 'scale(1) rotate(0)';
                });
            });

            // أنيميشن للأرقام في لوحة المفاتيح
            document.querySelectorAll('.num-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.style.transform = 'scale(1)';
                    }, 100);
                });
            });
        });
    },

    // ============= الرسائل المنبثقة =============
    showMessage(title, message) {
        const popup = document.getElementById('message-popup');
        const popupTitle = document.getElementById('popup-title');
        const popupMessage = document.getElementById('popup-message');
        const popupIcon = document.getElementById('popup-icon');

        if (!popup || !popupTitle || !popupMessage || !popupIcon) return;

        // تحديث المحتوى
        popupTitle.textContent = title;
        popupMessage.textContent = message;

        // تحديث الأيقونة حسب نوع الرسالة
        if (title.includes('صحيحة') || title.includes('مبروك')) {
            popupIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            popupIcon.style.color = 'var(--grade4-success)';
        } else if (title.includes('خاطئة') || title.includes('انتهى')) {
            popupIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
            popupIcon.style.color = 'var(--grade4-danger)';
        } else {
            popupIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
            popupIcon.style.color = 'var(--grade4-primary)';
        }

        // إظهار الرسالة
        popup.style.display = 'flex';

        // إغلاق تلقائي بعد 3 ثوان
        setTimeout(() => {
            this.hideMessage();
        }, 3000);
    },

    hideMessage() {
        const popup = document.getElementById('message-popup');
        if (popup) {
            popup.style.display = 'none';
        }
    },

    // ============= دوال مساعدة =============
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    // ============= التشغيل عند التحميل =============
    start() {
        // تحديث نموذج الطالب
        this.updateStudentForm();

        // بدء الأنيميشنات
        this.initAnimations();

        // عرض رسالة ترحيبية
        setTimeout(() => {
            if (!this.state.student.name) {
                this.showMessage('مرحباً!', 'أدخل اسمك لتبدأ رحلة التعلم');
            }
        }, 1000);
    }
};

// ==================== بدء اللعبة ====================
document.addEventListener('DOMContentLoaded', () => {
    MathAdventureGame.init();
    MathAdventureGame.start();
});

// ==================== تصدير للنظام ====================
window.MathAdventureGame = MathAdventureGame;