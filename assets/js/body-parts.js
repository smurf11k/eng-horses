document.addEventListener('DOMContentLoaded', () => {
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'svg-tooltip';
    document.body.appendChild(tooltip);

    // Create sidebar element
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    const sidebarContent = document.createElement('div');
    sidebarContent.className = 'sidebar-content';
    sidebarContent.innerHTML = '<p>Click on a body part to see what it means</p>';
    sidebar.appendChild(sidebarContent);
    document.body.appendChild(sidebar);

    // Create list toggle button
    const listToggleButton = document.createElement('button');
    listToggleButton.className = 'sidebar-toggle';
    listToggleButton.innerHTML = '☰';
    sidebar.appendChild(listToggleButton);

    // Create mode toggle button
    const modeToggleButton = document.createElement('button');
    modeToggleButton.className = 'mode-toggle';
    modeToggleButton.innerHTML = 'Quiz';
    sidebar.appendChild(modeToggleButton);

    // Track states
    let isListMode = false;
    let isQuizMode = false;
    let clickedGroup = null;
    let selectedWord = null;
    let correctMatches = 0;
    let matchesAttempted = 0;
    let shuffledWords = [];

    // Store original styles and group data
    const groupStyles = new Map();
    const groups = document.querySelectorAll('g[transform]:not(#background)');
    const groupData = Array.from(groups).map(group => ({
        id: group.id,
        title: group.querySelector('title')?.textContent || 'Untitled',
        desc: group.querySelector('desc')?.textContent || 'No description',
        originalTitle: group.querySelector('title')?.textContent || 'Untitled',
        matched: false,
        correct: false
    }));

    groups.forEach(group => {
        const paths = group.querySelectorAll('path');
        const originalStyles = Array.from(paths).map(path => ({
            stroke: path.style.stroke || getComputedStyle(path).stroke,
            strokeWidth: path.style.strokeWidth || getComputedStyle(path).strokeWidth,
            fillOpacity: path.style.fillOpacity || getComputedStyle(path).fillOpacity,
            fill: path.style.fill || getComputedStyle(path).fill
        }));
        groupStyles.set(group, originalStyles);
        paths.forEach(path => path.classList.add('color-toggle')); // Ensure all paths have color-toggle class
    });

    // Shuffle array
    const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Highlight group
    const highlightGroup = (group) => {
        const paths = group.querySelectorAll('path');
        const isColorModeOn = document.body.classList.contains('color-mode-on');
        paths.forEach(path => {
            path.style.stroke = '#22664C';
            path.style.strokeWidth = '0.5';
            if (isQuizMode && groupData.find(g => g.id === group.id)?.matched) {
                path.style.fillOpacity = '0.3';
            } else if (isQuizMode) {
                const styles = groupStyles.get(group);
                const pathIndex = Array.from(group.querySelectorAll('path')).indexOf(path);
                path.style.fill = styles[pathIndex].fill;
                path.style.fillOpacity = '0.5';
            } else {
                path.style.fill = isColorModeOn ? (path.style.fill || getComputedStyle(path).fill) : 'slategray';
                path.style.fillOpacity = isColorModeOn ? '0.5' : '0.05';
            }
        });
    };

    // Reset group style
    const resetGroupStyle = (group) => {
        const paths = group.querySelectorAll('path');
        const styles = groupStyles.get(group);
        const isColorModeOn = document.body.classList.contains('color-mode-on');
        paths.forEach((p, i) => {
            p.style.stroke = styles[i].stroke;
            p.style.strokeWidth = styles[i].strokeWidth;
            if (isQuizMode && groupData.find(g => g.id === group.id)?.matched) {
                p.style.fillOpacity = '0.3';
            } else {
                p.style.fill = isColorModeOn ? styles[i].fill : 'slategray';
                p.style.fillOpacity = isColorModeOn ? styles[i].fillOpacity : '0.05';
            }
        });
    };

    // Update all group styles
    const updateAllGroupStyles = () => {
        groups.forEach(group => {
            const isMatched = groupData.find(g => g.id === group.id)?.matched;
            const paths = group.querySelectorAll('path');
            paths.forEach(path => {
                path.classList.remove('correct', 'incorrect'); // Clear quiz classes unless matched
            });
            if (group === clickedGroup || (isQuizMode && isMatched)) {
                highlightGroup(group);
            } else {
                resetGroupStyle(group);
            }
        });
    };

    // Toggle title attributes for quiz mode
    const toggleTitles = (disable) => {
        groups.forEach(group => {
            const titleEl = group.querySelector('title');
            if (titleEl) {
                if (disable) {
                    titleEl.textContent = '';
                } else {
                    const data = groupData.find(g => g.id === group.id);
                    titleEl.textContent = data.originalTitle;
                }
            }
        });
    };

    // Check answer
    const checkAnswer = () => {
        if (selectedWord && clickedGroup) {
            const groupTitle = groupData.find(g => g.id === clickedGroup.id).title;
            const isCorrect = groupTitle === selectedWord;
            matchesAttempted++;
            const groupDataEntry = groupData.find(g => g.id === clickedGroup.id);
            groupDataEntry.matched = true;
            groupDataEntry.correct = isCorrect;
            if (isCorrect) correctMatches++;
            const entry = document.querySelector(`#quiz-entry-${groupData.findIndex(g => g.id === clickedGroup.id)}`);
            entry.innerHTML = `<h3>${groupTitle}</h3>`;
            entry.style.background = isCorrect ? 'var(--quiz-correct-color)' : 'var(--quiz-incorrect-color)';
            const paths = clickedGroup.querySelectorAll('path');
            paths.forEach(path => {
                path.style.stroke = groupStyles.get(clickedGroup)[0].stroke;
                path.style.strokeWidth = groupStyles.get(clickedGroup)[0].strokeWidth;
                path.classList.remove('correct', 'incorrect');
                path.classList.add(isCorrect ? 'correct' : 'incorrect');
                path.style.fillOpacity = '0.3';
            });
            groupData.find(gd => gd.title === selectedWord).matched = true;
            selectedWord = null;
            clickedGroup = null;
            document.querySelectorAll('.quiz-word.active-word').forEach(el => el.classList.remove('active-word'));
            document.querySelectorAll('.sidebar-entry.active').forEach(el => el.classList.remove('active'));
            renderQuizMode();
        }
    };

    // Render quiz mode
    const renderQuizMode = () => {
        sidebarContent.innerHTML = '';
        const upperPart = document.createElement('div');
        upperPart.className = 'quiz-upper';
        const lowerPart = document.createElement('div');
        lowerPart.className = 'quiz-lower';

        // Upper part: words
        const remainingWords = groupData.filter(g => !g.matched).map(g => g.title);
        if (remainingWords.length === 0) {
            const scoreDisplay = document.createElement('div');
            scoreDisplay.className = 'quiz-score';
            scoreDisplay.innerHTML = `<p>Score: ${correctMatches}/${groupData.length}</p>`;
            upperPart.appendChild(scoreDisplay);
        } else {
            if (shuffledWords.length === 0) {
                shuffledWords = shuffle([...remainingWords]);
            }
            shuffledWords.forEach(word => {
                if (remainingWords.includes(word)) {
                    const wordEntry = document.createElement('div');
                    wordEntry.className = 'quiz-word';
                    wordEntry.textContent = word;
                    wordEntry.addEventListener('click', () => {
                        if (selectedWord === word) {
                            selectedWord = null;
                            wordEntry.classList.remove('active-word');
                            if (clickedGroup) {
                                resetGroupStyle(clickedGroup);
                                clickedGroup = null;
                                document.querySelectorAll('.sidebar-entry.active').forEach(el => el.classList.remove('active'));
                            }
                        } else {
                            selectedWord = word;
                            document.querySelectorAll('.quiz-word.active-word').forEach(el => el.classList.remove('active-word'));
                            wordEntry.classList.add('active-word');
                            checkAnswer();
                        }
                    });
                    upperPart.appendChild(wordEntry);
                }
            });
        }

        // Lower part: question marks or matched titles
        groupData.forEach((g, index) => {
            const entry = document.createElement('div');
            entry.className = 'sidebar-entry';
            entry.id = `quiz-entry-${index}`;
            entry.innerHTML = g.matched ? `<h3>${g.title}</h3>` : `<h3>?</h3>`;
            if (g.matched) {
                entry.style.background = g.correct ? 'var(--quiz-correct-color)' : 'var(--quiz-incorrect-color)';
            }
            if (!g.matched) {
                entry.addEventListener('click', () => {
                    const group = document.querySelector(`#${g.id}`);
                    if (clickedGroup === group) {
                        resetGroupStyle(clickedGroup);
                        clickedGroup = null;
                        entry.classList.remove('active');
                    } else {
                        if (clickedGroup) resetGroupStyle(clickedGroup);
                        clickedGroup = group;
                        highlightGroup(group);
                        document.querySelectorAll('.sidebar-entry.active').forEach(el => el.classList.remove('active'));
                        entry.classList.add('active');
                        checkAnswer();
                    }
                });
            }
            lowerPart.appendChild(entry);
        });

        sidebarContent.appendChild(upperPart);
        sidebarContent.appendChild(lowerPart);
    };

    // Render list mode
    const renderListMode = () => {
        sidebarContent.innerHTML = '';
        groups.forEach((group, index) => {
            const title = groupData[index].originalTitle;
            const entry = document.createElement('div');
            entry.className = 'sidebar-entry';
            entry.id = `sidebar-entry-${index}`;
            entry.innerHTML = `<h3>${title}</h3>`;
            if (group === clickedGroup) entry.classList.add('active');
            sidebarContent.appendChild(entry);

            entry.addEventListener('click', (e) => {
                const targetGroup = document.querySelector(`#${groupData[index].id}`);
                if (clickedGroup && clickedGroup !== targetGroup) {
                    resetGroupStyle(clickedGroup);
                }
                clickedGroup = targetGroup;
                highlightGroup(clickedGroup);
                document.querySelector('.sidebar-entry.active')?.classList.remove('active');
                entry.classList.add('active');
                e.stopPropagation();
            });
        });
    };

    // Render single mode
    const renderSingleMode = () => {
        if (clickedGroup) {
            const groupInfo = groupData.find(g => g.id === clickedGroup.id);
            const title = groupInfo.originalTitle;
            const desc = groupInfo.desc;
            sidebarContent.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
        } else {
            sidebarContent.innerHTML = '<p>Click on a body part to see what it means</p>';
        }
    };

    // Toggle list mode
    listToggleButton.addEventListener('click', () => {
        if (isQuizMode) return;
        isListMode = !isListMode;
        listToggleButton.innerHTML = isListMode ? '◻' : '☰';
        if (isListMode) {
            renderListMode();
        } else {
            renderSingleMode();
        }
    });

    // Toggle quiz mode
    modeToggleButton.addEventListener('click', () => {
        isQuizMode = !isQuizMode;
        modeToggleButton.innerHTML = isQuizMode ? 'Learn' : 'Quiz';
        listToggleButton.disabled = isQuizMode;
        document.body.classList.toggle('quiz-mode', isQuizMode);
        toggleTitles(isQuizMode);
        if (isQuizMode) {
            isListMode = true;
            listToggleButton.innerHTML = '◻';
            groupData.forEach(g => {
                g.matched = false;
                g.correct = false;
                const group = document.querySelector(`#${g.id}`);
                group.querySelectorAll('path').forEach(path => {
                    path.classList.remove('correct', 'incorrect');
                });
                resetGroupStyle(group);
            });
            correctMatches = 0;
            matchesAttempted = 0;
            clickedGroup = null;
            selectedWord = null;
            shuffledWords = [];
            renderQuizMode();
        } else {
            groups.forEach(group => {
                group.querySelectorAll('path').forEach(path => {
                    path.classList.remove('correct', 'incorrect');
                });
                resetGroupStyle(group);
            });
            clickedGroup = document.querySelector('#drop-ribcage');
            if (clickedGroup) highlightGroup(clickedGroup);
            if (isListMode) {
                renderListMode();
            } else {
                renderSingleMode();
            }
        }
        updateAllGroupStyles();
    });

    // Toggle color mode
    function toggleColorMode() {
        document.body.classList.toggle('color-mode-on');
        if (clickedGroup) {
            resetGroupStyle(clickedGroup); // Clear current clicked group styles
        }
        clickedGroup = null; // Reset clicked group to avoid stale state
        groups.forEach(group => {
            resetGroupStyle(group); // Reset all groups to base styles
        });
        if (!isQuizMode) {
            const defaultGroup = document.querySelector('#drop-ribcage');
            if (defaultGroup) {
                clickedGroup = defaultGroup;
                highlightGroup(clickedGroup);
            }
            renderSingleMode(); // Re-render sidebar to reflect default state
        }
        updateAllGroupStyles(); // Ensure all groups reflect new color mode
    }

    groups.forEach((group, index) => {
        const paths = group.querySelectorAll('path');
        const titleEl = group.querySelector('title');

        // Click event
        group.addEventListener('click', (e) => {
            if (isQuizMode) {
                if (clickedGroup === group) {
                    resetGroupStyle(clickedGroup);
                    clickedGroup = null;
                    document.querySelectorAll('.sidebar-entry.active').forEach(el => el.classList.remove('active'));
                } else {
                    if (clickedGroup) resetGroupStyle(clickedGroup);
                    clickedGroup = group;
                    highlightGroup(group);
                    const entry = document.querySelector(`#quiz-entry-${index}`);
                    document.querySelectorAll('.sidebar-entry.active').forEach(el => el.classList.remove('active'));
                    entry.classList.add('active');
                    checkAnswer();
                }
            } else {
                if (clickedGroup && clickedGroup !== group) {
                    resetGroupStyle(clickedGroup);
                }
                clickedGroup = group;
                highlightGroup(group);
                if (isListMode) {
                    renderListMode();
                    document.querySelector(`#sidebar-entry-${index}`).classList.add('active');
                } else {
                    renderSingleMode();
                }
            }
            updateAllGroupStyles(); // Ensure all groups are updated after click
            e.stopPropagation();
        });

        // Mouseover event
        group.addEventListener('mouseover', (e) => {
            if (titleEl) {
                titleEl.dataset.originalTitle = titleEl.textContent || groupData.find(g => g.id === group.id).originalTitle;
                titleEl.textContent = '';
            }
            if (!isQuizMode) {
                const groupInfo = groupData.find(g => g.id === group.id);
                tooltip.textContent = groupInfo.originalTitle;
                tooltip.style.display = 'block';
                tooltip.style.left = `${e.pageX + 10}px`;
                tooltip.style.top = `${e.pageY + 10}px`;
            }
            if (group !== clickedGroup && (!isQuizMode || !groupData.find(g => g.id === group.id).matched)) {
                highlightGroup(group);
            }
        });

        // Mousemove event
        group.addEventListener('mousemove', (e) => {
            if (!isQuizMode) {
                tooltip.style.left = `${e.pageX + 10}px`;
                tooltip.style.top = `${e.pageY + 10}px`;
            }
        });

        // Mouseout event
        group.addEventListener('mouseout', () => {
            if (titleEl) {
                titleEl.textContent = groupData.find(g => g.id === group.id).originalTitle;
            }
            if (!isQuizMode) {
                tooltip.style.display = 'none';
            }
            if (group !== clickedGroup && (!isQuizMode || !groupData.find(g => g.id === group.id).matched)) {
                resetGroupStyle(group);
            }
        });
    });

    // Set default layer (drop-ribcage) on load
    const defaultGroup = document.querySelector('g#drop-ribcage');
    if (defaultGroup && !isQuizMode) {
        clickedGroup = defaultGroup;
        highlightGroup(clickedGroup);
        const groupInfo = groupData.find(g => g.id === defaultGroup.id);
        sidebarContent.innerHTML = `<h3>${groupInfo.originalTitle}</h3><p>${groupInfo.desc}</p>`;
    }

    // Handle background clicks
    document.addEventListener('click', (e) => {
        if (isQuizMode) return;
        if (!e.target.closest('g[transform]:not(#background)')) {
            if (clickedGroup) {
                resetGroupStyle(clickedGroup);
                clickedGroup = null;
            }
            if (isListMode) {
                renderListMode();
            } else {
                sidebarContent.innerHTML = '<p>Click on a body part to see what it means</p>';
            }
            updateAllGroupStyles();
        }
    });

    // Expose toggleColorMode globally for HTML button
    window.toggleColorMode = toggleColorMode;
});