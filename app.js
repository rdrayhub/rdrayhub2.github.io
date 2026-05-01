// --- DOM Elements ---
const questionContainer = document.getElementById('question-container');
const searchBar = document.getElementById('search-bar');

const streakCountEl = document.getElementById('streak-count');
const practicedCountEl = document.getElementById('practiced-count');
const userRankEl = document.getElementById('user-rank');
const streakIconEl = document.getElementById('streak-icon');
const rankIconEl = document.getElementById('rank-icon');

let allQuestions = [];

// --- State Management ---
let userStats = JSON.parse(localStorage.getItem('interviewStats')) || {
    totalPracticed: 0,
    lastPracticedDate: null,
    streak: 0,
    confidenceLevels: {} 
};

// --- 1. Update UI ---
function updateStatsUI() {
    practicedCountEl.innerText = userStats.totalPracticed;
    streakCountEl.innerText = userStats.streak;

    if (userStats.totalPracticed >= 20) {
        userRankEl.innerText = "Interview Master"; rankIconEl.innerText = "👑";
    } else if (userStats.totalPracticed >= 5) {
        userRankEl.innerText = "Confident Speaker"; rankIconEl.innerText = "🗣️";
    } else {
        userRankEl.innerText = "Novice"; rankIconEl.innerText = "🌱";
    }

    if (userStats.streak >= 5) { streakIconEl.innerText = "🚀"; } 
    else if (userStats.streak >= 2) { streakIconEl.innerText = "🔥"; } 
    else { streakIconEl.innerText = "📅"; }
}

// --- 2. Handle Answer Submission (Simulated AI Feedback) ---
window.submitAnswer = function(questionId) {
    const textarea = document.getElementById(`answer-input-${questionId}`);
    const answerText = textarea.value.toLowerCase().trim();
    
    if (!answerText) {
        alert("Please type an answer before getting feedback!");
        return;
    }

    const questionData = allQuestions.find(q => q.id === questionId);
    let matchedKeywords = 0;

    // Scan for keywords
    questionData.keywords.forEach(keyword => {
        if (answerText.includes(keyword.toLowerCase())) {
            matchedKeywords++;
        }
    });

    // Generate simulated feedback
    let scoreClass = "low";
    let scoreText = "Keep Practicing";
    let feedbackMessage = "Your answer might be missing some core concepts. Review the hint and try to include more specific details.";

    if (matchedKeywords >= 3) {
        scoreClass = "high";
        scoreText = "Excellent Answer!";
        feedbackMessage = "Great job! You hit multiple key concepts expected for this question.";
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); // Confetti for great answers!
    } else if (matchedKeywords >= 1) {
        scoreClass = "med";
        scoreText = "Good Start";
        feedbackMessage = "You touched on some good points, but could add a bit more depth or structure to your answer.";
    }

    // Update stats and streak
    if (!userStats.confidenceLevels[questionId]) {
        const today = new Date().toDateString();
        userStats.totalPracticed += 1;
        userStats.confidenceLevels[questionId] = "Getting There"; // Default state after submission

        if (userStats.lastPracticedDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (userStats.lastPracticedDate === yesterday.toDateString()) {
                userStats.streak += 1; 
            } else {
                userStats.streak = 1; 
            }
            userStats.lastPracticedDate = today;
        }
        localStorage.setItem('interviewStats', JSON.stringify(userStats));
        updateStatsUI();
    }

    // Show feedback
    const feedbackContainer = document.getElementById(`feedback-${questionId}`);
    feedbackContainer.innerHTML = `
        <div class="feedback-box">
            <h4>🤖 Smart Analysis</h4>
            <span class="feedback-score ${scoreClass}">${scoreText}</span>
            <p>${feedbackMessage}</p>
            <p><strong>Expert Insight:</strong> ${questionData.expertInsight}</p>
        </div>
    `;

    // Hide text input and show confidence dropdown
    document.getElementById(`input-section-${questionId}`).style.display = 'none';
    renderConfidenceDropdown(questionId, document.getElementById(`dropdown-container-${questionId}`));
    document.getElementById(`card-${questionId}`).classList.add('completed');
}

// --- 3. Handle Confidence Dropdown Changes ---
window.updateConfidence = function(questionId, newConfidence) {
    userStats.confidenceLevels[questionId] = newConfidence;
    localStorage.setItem('interviewStats', JSON.stringify(userStats));
    displayQuestions(allQuestions); 
}

// --- Helper to render the dropdown ---
function renderConfidenceDropdown(qId, container) {
    const confidence = userStats.confidenceLevels[qId] || "Getting There";
    const statusClass = confidence.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    container.innerHTML = `
        <div class="tracker-controls">
            <label>Rate Your Confidence:</label>
            <select class="status-dropdown ${statusClass}" onchange="updateConfidence(${qId}, this.value)">
                <option value="Nailed It" ${confidence === 'Nailed It' ? 'selected' : ''}>Nailed It! 🎉</option>
                <option value="Getting There" ${confidence === 'Getting There' ? 'selected' : ''}>Getting There</option>
                <option value="Needs Work" ${confidence === 'Needs Work' ? 'selected' : ''}>Needs Work</option>
            </select>
        </div>
    `;
}

// --- 4. Render Questions ---
function displayQuestions(questions) {
    questionContainer.innerHTML = '';
    
    if (questions.length === 0) {
        questionContainer.innerHTML = '<p>No questions found matching your search.</p>';
        return;
    }

    questions.forEach(q => {
        const confidence = userStats.confidenceLevels[q.id];
        const isPracticed = !!confidence;
        
        let cardClasses = `question-card`;
        if (isPracticed) {
            const statusClass = confidence.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            cardClasses += ` completed ${statusClass}`;
        }
        
        const card = document.createElement('div');
        card.id = `card-${q.id}`;
        card.className = cardClasses;
        
        const formattedLevelClass = q.level.toLowerCase().replace(/\s+/g, '-');

        // Toggle Input Field vs Dropdown
        let interactionHTML = '';
        if (isPracticed) {
            interactionHTML = `<div id="dropdown-container-${q.id}"></div>`;
        } else {
            interactionHTML = `
                <div class="answer-section" id="input-section-${q.id}">
                    <textarea class="answer-input" id="answer-input-${q.id}" placeholder="Type your answer here..."></textarea>
                    <button class="submit-answer-btn" onclick="submitAnswer(${q.id})">Get Feedback</button>
                </div>
                <div id="dropdown-container-${q.id}"></div>
            `;
        }

        card.innerHTML = `
            <div class="card-header">
                <span class="tag">${q.category}</span>
                <span class="level-badge level-${formattedLevelClass}">${q.level}</span>
            </div>
            <h2>${q.question}</h2>
            <div class="hint-box"><strong>💡 Hint:</strong> ${q.hint}</div>
            
            ${interactionHTML}
            <div id="feedback-${q.id}"></div>
        `;
        
        questionContainer.appendChild(card);

        if (isPracticed) {
            renderConfidenceDropdown(q.id, document.getElementById(`dropdown-container-${q.id}`));
        }
    });
}

// --- 5. Fetch Data ---
async function fetchQuestions() {
    try {
        const response = await fetch('./questions.json');
        if (!response.ok) throw new Error("Network error");
        
        allQuestions = await response.json();
        updateStatsUI(); 
        displayQuestions(allQuestions); 
    } catch (error) {
        console.error("Error loading questions:", error);
        questionContainer.innerHTML = "<p>Unable to load questions. Please run via a local server.</p>";
    }
}

// --- 6. Search Logic ---
searchBar.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allQuestions.filter(q => 
        q.question.toLowerCase().includes(term) || 
        q.category.toLowerCase().includes(term)
    );
    displayQuestions(filtered);
});

fetchQuestions();