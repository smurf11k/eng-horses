const words = [
    "very fast", "cute", "apples", "saddle", "stables", "open fields", "brushing",
    "cleaning", "carts", "kids", "chew", "sleep", "bridle", "run", "whiskers",
    "group", "water", "people", "bond", "large eyes", "direction", "smell"
];

const sentences = [
    "Horses can run ______ and love to race.",
    "A young horse is called a foal and is very ______.",
    "Horses eat grass, hay, and sometimes treats like ______ or carrots.",
    "A ______ is a set of straps that fits on a horse’s head, allowing the rider to control the horse using the reins and bit.",
    "Horses can live in barns or ______ to stay safe and warm.",
    "Wild horses live in ______ and run in herds.",
    "Horses need regular care, like ______ their coats and ______ their hooves.",
    "Some horses are used to pull ______ or plows on farms.",
    "Ponies are small horses that are great for ______ to ride.",
    "A horse’s teeth never stop growing, which helps them ______ tough grass.",
    "Horses can ______ both standing up and lying down.",
    "People ride horses using a ______ and reins to guide them.",
    "Horses can ______ shortly after they are born, usually within a few hours.",
    "Each horse has a unique pattern of ______ on its muzzle, just like a fingerprint.",
    "A ______ of horses is called a herd, and they like to stay together.",
    "Horses can drink up to 10 gallons of ______ a day to stay healthy and hydrated.",
    "Horses have excellent smell, often remembering ______ and places even after many years.",
    "The ______ between a horse and its rider can be incredibly strong, built on trust, respect, and mutual understanding.",
    "Horses have a special way of seeing the world: their ______ give them nearly 360-degree vision, allowing them to spot predators from almost any ______.",
    "Horses use their sense of ______ to recognize other horses and humans, as they have a keen ability to detect different scents from far away."
];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function createSentenceHTML(sentence) {
    return sentence.replace(/______/g, `<span class="blank" ondrop="drop(event)" ondragover="event.preventDefault()" onclick="revertWord(event)"></span>`);
}

function loadGame() {
    const sentencesContainer = document.getElementById('sentences');
    const wordsContainer = document.getElementById('words');

    let emptyMessage = document.createElement('div');
    emptyMessage.id = 'emptyMessage';
    emptyMessage.innerText = 'No more words left!';
    emptyMessage.style.display = 'none';
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.marginTop = '20px';
    wordsContainer.appendChild(emptyMessage);

    sentences.forEach(s => {
        const sentenceDiv = document.createElement('div');
        sentenceDiv.className = 'sentence';
        sentenceDiv.innerHTML = createSentenceHTML(s);
        sentencesContainer.appendChild(sentenceDiv);
    });

    shuffleArray(words);

    words.forEach((word, index) => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word';
        wordDiv.draggable = true;
        wordDiv.id = 'word' + index;
        wordDiv.innerText = word;
        wordDiv.ondragstart = drag;
        wordsContainer.insertBefore(wordDiv, emptyMessage);
    });

    checkWordsLeft();
}

function drag(event) {
    event.dataTransfer.setData("text/plain", event.target.id);
}

function drop(event) {
    event.preventDefault();
    const blank = event.target;
    if (blank.innerText.trim() !== "") return; // no multiple words in one blank

    const wordId = event.dataTransfer.getData("text/plain");
    const wordElement = document.getElementById(wordId);
    if (wordElement) {
        blank.innerText = wordElement.innerText;
        blank.dataset.wordId = wordId;
        wordElement.remove();
        checkWordsLeft();
    }
}

function revertWord(event) {
    const blank = event.target;
    if (!blank.classList.contains('blank') || blank.innerText.trim() === "") return;

    // Disable revert if answers are checked (words disabled)
    if (document.body.classList.contains('checked')) return;

    const wordsContainer = document.getElementById('words');
    const wordId = blank.dataset.wordId;

    if (!document.getElementById(wordId)) {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word';
        wordDiv.draggable = true;
        wordDiv.id = wordId;
        wordDiv.innerText = blank.innerText;
        wordDiv.ondragstart = drag;
        const emptyMessage = document.getElementById('emptyMessage');
        wordsContainer.insertBefore(wordDiv, emptyMessage);
    }

    blank.innerText = "";
    delete blank.dataset.wordId;
    checkWordsLeft();
}

function checkWordsLeft() {
    const wordsContainer = document.getElementById('words');
    const wordElements = wordsContainer.querySelectorAll('.word');
    const emptyMessage = document.getElementById('emptyMessage');
    emptyMessage.style.display = wordElements.length === 0 ? 'block' : 'none';
}

function checkAnswers() {
    const correctAnswers = [
        "very fast", "cute", "apples", "bridle", "stables", "open fields", "brushing",
        "cleaning", "carts", "kids", "chew", "sleep", "saddle", "run", "whiskers",
        "group", "water", "people", "bond", "large eyes", "direction", "smell"
    ];

    const blanks = document.querySelectorAll('.blank');
    let correctCount = 0;

    blanks.forEach((blank, i) => {
        if (blank.innerText === correctAnswers[i]) {
            blank.style.backgroundColor = 'lightgreen';
            correctCount++;
        } else {
            blank.style.backgroundColor = 'lightcoral';
        }
    });

    // Disable dragging and revert after checking
    document.querySelectorAll('.word').forEach(word => {
        word.draggable = false;
        word.style.cursor = 'default';
        word.ondragstart = null;
    });

    // Disable reverting words from blanks
    document.body.classList.add('checked');

    // Show score instead of "no more words"
    const emptyMessage = document.getElementById('emptyMessage');
    emptyMessage.innerText = `Score ${correctCount}/${blanks.length}`;
    emptyMessage.style.display = 'block';
}

window.onload = loadGame;
