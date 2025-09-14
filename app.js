// This DOM references needed
const languageSelect = document.getElementById('languageSelect');
const statePanel = document.getElementById('statePanel');
const stateMessage = document.getElementById('stateMessage');
const retryButton = document.getElementById('retryButton');
const repoCard = document.getElementById('repoCard');
const repoName = document.getElementById('repoName');
const repoExternal = document.getElementById('repoExternal');
const repoDescription = document.getElementById('repoDescription');
const repoLanguage = document.getElementById('repoLanguage');
const repoStars = document.getElementById('repoStars');
const repoForks = document.getElementById('repoForks');
const repoIssues = document.getElementById('repoIssues');
const refreshButton = document.getElementById('refreshButton');

// This Constants Of URL
const Program_lang_URL = 'https://raw.githubusercontent.com/kamranahmedse/githunt/master/src/components/filters/language-filter/languages.json';
const Github_Search_URL = 'https://api.github.com/search/repositories';

// This States UI to show(mssg) or hidden
function showStatePanel(show) {
	if (show) statePanel.classList.remove('hidden');
	else statePanel.classList.add('hidden');
}

function setPanelState(kindState, message) {
	statePanel.classList.remove('panel_neutral', 'panel_loading', 'panel_error');
	retryButton.classList.add('hidden');
	stateMessage.textContent = message;
	switch (kindState) {
		case 'loading':
			statePanel.classList.add('panel_loading');
			break;
		case 'error':
			statePanel.classList.add('panel_error');
			retryButton.classList.remove('hidden');
			break;
		default:
			statePanel.classList.add('panel_neutral');
	}
	showStatePanel(true);
}
// This fun to show or hidden of card repo
function showRepoCard(show) {
	if (show) {
		repoCard.classList.remove('hidden');
	} else {
		repoCard.classList.add('hidden');
	}
}
// This fun to show or hidden of refresh button
function showRefreshButton(show) {
	if (show) refreshButton.classList.remove('hidden');
	else refreshButton.classList.add('hidden');
}

// Rendering to show reposetry with all his information
function renderRepository(repo) {
	repoName.textContent = repo.full_name || repo.name;
	repoExternal.href = repo.html_url;
	repoDescription.textContent = repo.description || 'No description of this repo.';
	repoLanguage.textContent = repo.language || 'Not known';
	repoStars.textContent = Intl.NumberFormat().format(repo.stargazers_count ?? 0);
	repoForks.textContent = Intl.NumberFormat().format(repo.forks_count ?? 0);
	repoIssues.textContent = Intl.NumberFormat().format(repo.open_issues_count ?? 0);
}

// This function fills the language (select) dropdown with new options,
// removing old ones except the default placeholder.
function appendLanguageOptions(languageNames) {
	// Clear existing except placeholder
	while (languageSelect.options.length > 1) {
		languageSelect.remove(1);
	}
	for (const name of languageNames) {
		const option = document.createElement('option');
		option.value = name;
		option.textContent = name;
		languageSelect.appendChild(option);
	}
}

// This async Function to loading data (languages) form URL 
async function loadLanguages() {
	const fallbackList = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'CSS', 'PHP', 'C++'];
	try {
		const respons = await fetch(Program_lang_URL, { cache: 'no-store' });
		if (!respons.ok) throw new Error('Error , Unable to load languages');
		const r = await respons.json();
		let names = [];
		if (Array.isArray(r)) {
			for (const item of r) {
				if (typeof item === 'string') names.push(item);
				else if (item && typeof item === 'object') {
					const n = item.name || item.value || item.language || item.title;
					if (n) names.push(n);
				}
			}
		}
		names = Array.from(new Set(names)).filter(Boolean).sort((a, b) => a.localeCompare(b));
		if (names.length === 0) throw new Error('Error , Languages list empty');
		appendLanguageOptions(names);
	} catch (err) {
		console.warn('Falling back to built-in List languages. Error:', err);
		appendLanguageOptions(fallbackList);
	}
}

// This async Function make GitHub Search to get a random repository given a language
async function fetchRandomRepository(language) {
	const baseQuery = `language:${encodeURIComponent(language)} stars:>0`;
	 const searchParams = new URLSearchParams({
        q: baseQuery,
        sort: 'stars',
        order: 'desc',
        per_page: '100', 
        page: '1'    
    });
	const res = await fetch(`${Github_Search_URL}?${searchParams.toString()}`);
	if (!res.ok) throw new Error('GitHub API error');
	const data = await res.json();
	if (!data.items || data.items.length === 0) throw new Error('No repositories found on page');
	const randomIndex = Math.floor(Math.random() * data.items.length);
	return data.items[randomIndex];
}

// This async function handles fetching a random GitHub repository based on the selected language,
// updates the UI to show loading state, displays the repository information, 
// and handles errors if the fetch fails.
async function handlingControler() {
	const language = languageSelect.value;
	if (!language) {
		showRepoCard(false);
		showRefreshButton(false);
		setPanelState('neutral', 'Please select a language');
		return;
	}

	showRepoCard(false);
	showRefreshButton(false);
	setPanelState('loading', 'Loading, please wait..');

	try {
		const repo = await fetchRandomRepository(language);
		renderRepository(repo);
		showRepoCard(true);
		showStatePanel(false); 
		showRefreshButton(true);
	} catch (err) {
		console.error(err);
		showRepoCard(false);
		setPanelState('error', 'Error fetching repositories');
	}
}

// This Events Wiring app 
languageSelect.addEventListener('change', handlingControler);
refreshButton.addEventListener('click', handlingControler);
retryButton.addEventListener('click', handlingControler);

// Initialize when load app 
(async function init() {
	try {
		await loadLanguages();
	} catch (err) {
		console.error(err);
		setPanelState('error', 'Sorry , Failed to load languages');
	}
})();

